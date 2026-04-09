#!/usr/bin/env node
/**
 * Save rule to form JSON or rule store using AFJSONFormulaTransformer and AFJSONFormulaMerger
 *
 * Two modes:
 *
 * 1. FORM MODE (legacy): Save directly to form.json
 *    node save-rule.js <rule.json> <form.json>
 *
 * 2. RULE STORE MODE: Save to separate rule store file (form-sync compatible)
 *    node save-rule.js <rule.json> --rule-store <store.rule.json> --form <form.json>
 *
 * Options:
 *   --rule-store <file>  Save to rule store file (form-sync format)
 *   --form <file>        Form JSON file (required for component lookup)
 *   --dry-run            Don't actually save, just show what would be saved
 *   --context <file>     Load FormContext for component validation
 *
 * Rule Store Format (form-sync compatible):
 *   {
 *     "<uuid>": {
 *       "componentPath": "text_input",
 *       "componentName": "firstName",
 *       "fd:rules": {
 *         "jcr:primaryType": "nt:unstructured",
 *         "fd:change": [{ ...rule JSON... }]
 *       },
 *       "fd:events": {
 *         "jcr:primaryType": "nt:unstructured",
 *         "change": ["formula string"]
 *       }
 *     }
 *   }
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load globals and transformers
require('../setup/globals');
require('../setup/loader').loadForRuleTransform();

// Load ContextLoader directly (not via vm)
const ContextLoader = require('../setup/ContextLoader');

// Trigger event value to event name mapping
const TRIGGER_EVENT_TO_NAME = {
    "is clicked": "Click",
    "is changed": "Value Commit",
    "is initialised": "Initialize",
    "is initialized": "Initialize"
};

// Event name to fd:events property mapping
const EVENT_NAME_TO_FD_PROPERTY = {
    "Value Commit": "change",
    "Click": "click",
    "Initialize": "initialize",
    "Calculate": "calc",
    "Visibility": "visible",
    "Enabled": "enabled",
    "Validate": "validate"
};

// Event name to fd:rules property mapping (fd: prefix)
const EVENT_NAME_TO_FD_RULES_PROPERTY = {
    "Value Commit": "fd:change",
    "Click": "fd:click",
    "Initialize": "fd:initialize",
    "Calculate": "fd:calc",
    "Visibility": "fd:visible",
    "Enabled": "fd:enabled",
    "Validate": "fd:validate"
};

// Primitive types that indicate a value (not an object reference)
const PRIMITIVE_TYPES = ['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'STRING[]', 'NUMBER[]', 'BOOLEAN[]'];

/**
 * Check if a type string contains OBJECT or AFCOMPONENT (indicating object reference expected)
 */
function isObjectTypeExpected(typeStr) {
    if (!typeStr) return false;
    const parts = typeStr.split('|').map(t => t.trim().toUpperCase());
    return parts.includes('OBJECT') || parts.includes('AFCOMPONENT');
}

/**
 * Check if a type string expects a primitive value
 */
function isPrimitiveTypeExpected(typeStr) {
    if (!typeStr) return false;
    const parts = typeStr.split('|').map(t => t.trim().toUpperCase());
    // Expects primitive if it contains a primitive type AND does not expect object
    return parts.some(t => PRIMITIVE_TYPES.includes(t)) && !isObjectTypeExpected(typeStr);
}

/**
 * Preprocess FUNCTION_CALL nodes to filter component types for primitive args.
 *
 * When a function arg expects a primitive type (STRING, NUMBER, etc.) and the
 * param is a COMPONENT, the component's type should be filtered to just the
 * primitive portion. This matches AEM's filterPrimitiveTypes() behavior.
 *
 * @param {object} node - Rule JSON node to process
 * @throws {Error} If rule JSON is malformed
 */
function preprocessFunctionCallTypes(node) {
    if (!node || typeof node !== 'object') return;

    // If this is a FUNCTION_CALL node, process it
    if (node.nodeName === 'FUNCTION_CALL') {
        const functionName = node.functionName;
        const params = node.params;

        // Validate: functionName must exist with args
        if (!functionName || !functionName.args) {
            throw new Error(`FUNCTION_CALL missing functionName or args: ${JSON.stringify(node, null, 2).substring(0, 200)}`);
        }

        // Validate: params must exist
        if (!params || !Array.isArray(params)) {
            throw new Error(`FUNCTION_CALL missing params array for function "${functionName.id}"`);
        }

        const args = functionName.args;

        // Validate: params count must match args count
        if (params.length !== args.length) {
            throw new Error(`FUNCTION_CALL "${functionName.id}": param count (${params.length}) != arg count (${args.length})`);
        }

        // Process each param
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            const arg = args[i];

            // Skip if param has no choice
            if (!param || !param.choice) continue;

            // Recursively process nested structures (e.g., nested FUNCTION_CALLs)
            preprocessFunctionCallTypes(param.choice);

            // Only filter if:
            // 1. Param is a COMPONENT
            // 2. Arg expects a primitive type (not OBJECT/AFCOMPONENT)
            if (param.choice.nodeName === 'COMPONENT' && isPrimitiveTypeExpected(arg.type)) {
                const component = param.choice.value;
                if (component && component.type) {
                    // Use expeditor.Utils.filterPrimitiveTypes to filter the type
                    const filteredType = expeditor.Utils.filterPrimitiveTypes(component.type);

                    if (!filteredType) {
                        throw new Error(
                            `FUNCTION_CALL "${functionName.id}": param "${arg.name}" expects primitive type "${arg.type}" ` +
                            `but component "${component.id}" has type "${component.type}" with no primitive portion`
                        );
                    }

                    // Update the component type to the filtered value
                    component.type = filteredType;
                }
            }
        }
    }

    // Recursively process all child nodes
    if (Array.isArray(node.items)) {
        for (const item of node.items) {
            preprocessFunctionCallTypes(item);
        }
    }
    if (node.choice) {
        preprocessFunctionCallTypes(node.choice);
    }
    if (node.params && Array.isArray(node.params)) {
        for (const param of node.params) {
            preprocessFunctionCallTypes(param);
        }
    }
}

/**
 * Generate a UUID v4
 */
function generateUUID() {
    return crypto.randomUUID();
}

/**
 * Auto-generate context from form.json
 * Runs transform-form and parse-functions internally
 */
function generateContextFromForm(formJsonPath) {
    const { execSync } = require('child_process');
    const cliDir = __dirname;

    // Read form.json to get customFunctionsPath
    const formJson = JSON.parse(fs.readFileSync(formJsonPath, 'utf-8'));
    const customFunctionsPath = formJson.customFunctionsPath;

    // Generate treeJson using transform-form
    let treeJson = null;
    try {
        const transformResult = execSync(
            `node "${path.join(cliDir, 'transform-form.js')}" "${formJsonPath}"`,
            { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        const parsed = JSON.parse(transformResult);
        if (parsed.success) {
            treeJson = parsed.treeJson;
        }
    } catch (e) {
        // Fall back to no treeJson if transform fails
    }

    // Parse custom functions if path exists
    let functions = [];
    if (customFunctionsPath) {
        // Resolve path relative to code directory
        const jsFilePath = path.resolve('code', customFunctionsPath.replace(/^\//, ''));

        if (fs.existsSync(jsFilePath)) {
            try {
                const parseResult = execSync(
                    `node "${path.join(cliDir, 'parse-functions.js')}" "${jsFilePath}"`,
                    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
                );
                const parsed = JSON.parse(parseResult);
                if (parsed.success && parsed.customFunction) {
                    functions = parsed.customFunction;
                }
            } catch (e) {
                // Fall back to empty functions if parse fails
            }
        }
    }

    if (!treeJson) {
        return null;
    }

    return { treeJson, functions };
}

/**
 * Extract trigger field and event from rule JSON
 */
function extractTriggerInfo(ruleJson) {
    if (!ruleJson || ruleJson.nodeName !== 'ROOT') {
        throw new Error('Invalid rule JSON');
    }

    const statement = ruleJson.items[0];
    if (!statement.choice || statement.choice.nodeName !== 'TRIGGER_SCRIPTS') {
        throw new Error('Only TRIGGER_SCRIPTS rules are supported');
    }

    const singleTriggerScripts = statement.choice.items[0];
    const items = singleTriggerScripts.items;
    const triggerComponent = items[0];
    const triggerEvent = items[1];

    const fieldValue = triggerComponent?.value;
    const fieldId = fieldValue?.id || fieldValue?.name || '$field';
    const fieldName = fieldValue?.name || fieldId.split('.').pop();

    const eventValue = triggerEvent?.value || 'is changed';
    const eventName = TRIGGER_EVENT_TO_NAME[eventValue] || eventValue;

    return { fieldId, fieldName, eventName, eventValue };
}

/**
 * Transform a single rule JSON to script object using AFJSONFormulaTransformer
 * Returns: { field, event, model, content }
 */
function transformRuleToScript(ruleJson, contextData) {
    const { fieldId, fieldName, eventName } = extractTriggerInfo(ruleJson);

    // Create SimpleContext for model creation
    let ctx;
    if (contextData && contextData.treeJson) {
        // Use validated context with real component data
        ctx = ContextLoader.createValidatedContext(contextData.treeJson, contextData.functions);
    } else {
        // Use synthetic context (default)
        ctx = new expeditor.SimpleContext();
    }

    // Create model hierarchy from rule JSON
    const model = expeditor.Utils.ModelFactory.fromJson(ruleJson, ctx);

    // Create AFJSONFormulaTransformer
    const transformer = new guidelib.author.AFJSONFormulaTransformer();

    // Set event context
    transformer.setEvent({
        field: fieldId,
        name: eventName,
        model: null,
        otherEvents: null
    });

    // Transform via visitor pattern
    model.accept(transformer);

    // Get result - returns { field, event, model, content }
    return transformer.getScript();
}

/**
 * Find a field in the form JSON by name (deep recursive search)
 * Returns: { key, component, componentPath }
 */
function findFieldInForm(formJson, fieldName) {
    // Special case: $form or FORM refers to the form root itself
    // Rule JSON uses "name": "FORM" which matches treeJson convention
    if (fieldName === '$form' || fieldName === 'FORM') {
        return { key: '', component: formJson, componentPath: '' };
    }

    // Deep recursive search
    function searchDeep(obj, path) {
        if (!obj || typeof obj !== 'object') return null;

        // Check if this object has the target name
        if (obj.name === fieldName) {
            const key = path.split('/').filter(Boolean).pop() || fieldName;
            return { key, component: obj, componentPath: path };
        }

        // Search in object properties (panel structure - keys like panelcontainer_123)
        for (const key of Object.keys(obj)) {
            // Skip metadata keys
            if (key.startsWith('fd:') || key.startsWith('jcr:') || key === 'items' || key === 'name' || key === 'fieldType') continue;

            const child = obj[key];
            if (child && typeof child === 'object' && !Array.isArray(child)) {
                const result = searchDeep(child, path ? `${path}/${key}` : key);
                if (result) return result;
            }
        }

        // Search in items array
        if (Array.isArray(obj.items)) {
            for (const item of obj.items) {
                if (item && typeof item === 'object') {
                    const result = searchDeep(item, path);
                    if (result) return result;
                }
            }
        }

        return null;
    }

    return searchDeep(formJson, '');
}

/**
 * Convert merged scripts to fd:events format
 * Input: { fieldId: { eventName: { content: [...] or "..." } } }
 * Output: { change: [...], click: [...], ... }
 */
function convertToFdEvents(mergedScripts, fieldId) {
    const fdEvents = {};
    const fieldScripts = mergedScripts[fieldId];

    if (!fieldScripts) {
        return fdEvents;
    }

    for (const [eventName, scriptObj] of Object.entries(fieldScripts)) {
        const fdProperty = EVENT_NAME_TO_FD_PROPERTY[eventName] || eventName.replace('custom:', '');
        fdEvents[fdProperty] = scriptObj.content;
    }

    return fdEvents;
}

/**
 * Find component entry in rule store by component name
 * Returns: { uuid, entry } or null
 */
function findComponentInRuleStore(ruleStore, componentName) {
    for (const [uuid, entry] of Object.entries(ruleStore)) {
        if (entry.componentName === componentName) {
            return { uuid, entry };
        }
    }
    return null;
}

/**
 * Update form.json with refs to the rule store entry
 * This ensures form-sync push can restore rules from the rule store
 */
function updateFormWithRefs(formJson, formJsonPath, fieldInfo, uuid, dryRun) {
    const component = fieldInfo.component;

    // Check if refs already exist and match
    const existingRulesRef = component['fd:rules']?.ref;
    const existingEventsRef = component['fd:events']?.ref;

    if (existingRulesRef === uuid && existingEventsRef === uuid) {
        // Refs already correct, no update needed
        return false;
    }

    // Set fd:rules and fd:events to ref objects
    component['fd:rules'] = { ref: uuid };
    component['fd:events'] = { ref: uuid };

    // Save the form JSON (unless dry-run)
    if (!dryRun) {
        fs.writeFileSync(formJsonPath, JSON.stringify(formJson, null, 2));
    }

    return true;
}

/**
 * Save rule to rule store (form-sync format)
 */
function saveToRuleStore(ruleJsonPath, ruleStorePath, formJsonPath, options = {}) {
    // Read new rule JSON
    if (!fs.existsSync(ruleJsonPath)) {
        throw new Error(`Rule file not found: ${ruleJsonPath}`);
    }
    const newRuleJson = JSON.parse(fs.readFileSync(ruleJsonPath, 'utf-8'));

    // Read form JSON for component lookup
    if (!fs.existsSync(formJsonPath)) {
        throw new Error(`Form file not found: ${formJsonPath}`);
    }
    const formJson = JSON.parse(fs.readFileSync(formJsonPath, 'utf-8'));

    // Read existing rule store (or create empty)
    let ruleStore = {};
    if (fs.existsSync(ruleStorePath)) {
        ruleStore = JSON.parse(fs.readFileSync(ruleStorePath, 'utf-8'));
    }

    // Extract trigger info from new rule
    const { fieldId, fieldName, eventName } = extractTriggerInfo(newRuleJson);

    // Find the field in the form
    const fieldInfo = findFieldInForm(formJson, fieldName);
    if (!fieldInfo) {
        throw new Error(`Field '${fieldName}' not found in form`);
    }

    // Find or create component entry in rule store
    let componentEntry = findComponentInRuleStore(ruleStore, fieldName);
    let uuid;

    if (componentEntry) {
        uuid = componentEntry.uuid;
    } else {
        // Create new entry
        uuid = generateUUID();
        ruleStore[uuid] = {
            componentPath: fieldInfo.componentPath,
            componentName: fieldName,
            "fd:rules": {
                "jcr:primaryType": "nt:unstructured"
            },
            "fd:events": {
                "jcr:primaryType": "nt:unstructured"
            }
        };
    }

    const entry = ruleStore[uuid];

    // Get the fd:rules property key for this event
    // For custom events like "custom:enableContinueButton", generate "fd:custom_enableContinueButton"
    // This matches the behavior in af-exp-editor RuleSaveHandler.js line 213-214
    let fdRulesKey, fdEventsKey;
    if (eventName.startsWith('custom:')) {
        const customEventName = eventName.substring('custom:'.length);
        fdRulesKey = `fd:custom_${customEventName}`;
        fdEventsKey = customEventName;
    } else {
        fdRulesKey = EVENT_NAME_TO_FD_RULES_PROPERTY[eventName] || `fd:${eventName.toLowerCase()}`;
        fdEventsKey = EVENT_NAME_TO_FD_PROPERTY[eventName] || eventName.toLowerCase();
    }

    // Get existing rules for this event
    const existingRules = entry["fd:rules"][fdRulesKey] || [];

    // Check if a rule with the same eventName already exists (replace vs append)
    const newEventName = newRuleJson.eventName;
    const existingIndex = newEventName
        ? existingRules.findIndex(r => r.eventName === newEventName)
        : -1;

    let allRules;
    let mode;
    if (existingIndex >= 0) {
        // Replace existing rule with same eventName
        allRules = [...existingRules];
        allRules[existingIndex] = newRuleJson;
        mode = 'replaced';
    } else {
        // Append new rule
        allRules = [...existingRules, newRuleJson];
        mode = 'added';
    }

    // Transform ALL rules for this component to scripts
    // Use the deduplicated allRules for the current event, plus rules from other events
    const scriptArray = [];

    for (const [key, rules] of Object.entries(entry["fd:rules"])) {
        if (!key.startsWith("fd:") || !Array.isArray(rules)) continue;

        // For the current event key, use allRules (deduplicated); for others, use as-is
        const rulesToTransform = (key === fdRulesKey) ? allRules : rules;

        for (const rule of rulesToTransform) {
            try {
                // Deep clone before preprocessing to preserve original rule JSON
                const ruleClone = JSON.parse(JSON.stringify(rule));
                // Preprocess to filter component types for primitive args
                preprocessFunctionCallTypes(ruleClone);
                const script = transformRuleToScript(ruleClone, options.contextData);
                scriptArray.push(script);
            } catch (e) {
                console.error(`Warning: Failed to transform existing rule: ${e.message}`);
            }
        }
    }

    // If this is a NEW event key (not yet in fd:rules), transform the new rule separately
    if (!entry["fd:rules"][fdRulesKey]) {
        try {
            const newRuleClone = JSON.parse(JSON.stringify(newRuleJson));
            preprocessFunctionCallTypes(newRuleClone);
            const newScript = transformRuleToScript(newRuleClone, options.contextData);
            scriptArray.push(newScript);
        } catch (e) {
            throw new Error(`Failed to transform new rule: ${e.message}`);
        }
    }

    // Use AFJSONFormulaMerger to merge all scripts
    const mergedScripts = guidelib.author.AFJSONFormulaMerger.mergeScript(scriptArray);

    // Convert merged scripts to fd:events format
    const fdEvents = convertToFdEvents(mergedScripts, fieldId);

    // Update entry with new rule
    entry["fd:rules"][fdRulesKey] = allRules;
    entry["fd:rules"]["validationStatus"] = "valid";

    // Update fd:events with all merged formulas
    for (const [eventKey, formulas] of Object.entries(fdEvents)) {
        entry["fd:events"][eventKey] = formulas;
    }

    // Save the rule store (unless dry-run)
    if (!options.dryRun) {
        fs.writeFileSync(ruleStorePath, JSON.stringify(ruleStore, null, 2));
    }

    // Update form.json with refs to the rule store entry
    const formUpdated = updateFormWithRefs(formJson, formJsonPath, fieldInfo, uuid, options.dryRun);

    console.log(`  Rule ${mode} for event "${fdRulesKey}" (${allRules.length} rules for this event, ${scriptArray.length} total scripts for component)`);

    return {
        success: true,
        mode: "rule-store",
        saveMode: mode, // "replaced" or "added"
        ruleStoreFile: ruleStorePath,
        formFile: formJsonPath,
        formUpdated: formUpdated,
        componentPath: fieldInfo.componentPath,
        componentName: fieldName,
        uuid: uuid,
        event: fdEventsKey,
        rulesCount: allRules.length,
        totalRulesForComponent: scriptArray.length,
        dryRun: options.dryRun || false,
        validationEnabled: !!(options.contextData && options.contextData.treeJson),
        fdEvents: entry["fd:events"]
    };
}

/**
 * Save rule to form JSON (legacy mode)
 */
function saveToForm(ruleJsonPath, formJsonPath, options = {}) {
    // Read new rule JSON
    if (!fs.existsSync(ruleJsonPath)) {
        throw new Error(`Rule file not found: ${ruleJsonPath}`);
    }
    const newRuleJson = JSON.parse(fs.readFileSync(ruleJsonPath, 'utf-8'));

    // Read form JSON
    if (!fs.existsSync(formJsonPath)) {
        throw new Error(`Form file not found: ${formJsonPath}`);
    }
    const formJson = JSON.parse(fs.readFileSync(formJsonPath, 'utf-8'));

    // Extract trigger info from new rule
    const { fieldId, fieldName, eventName } = extractTriggerInfo(newRuleJson);

    // Find the field in the form
    const fieldInfo = findFieldInForm(formJson, fieldName);
    if (!fieldInfo) {
        throw new Error(`Field '${fieldName}' not found in form`);
    }

    // Get existing rules from fd:rules
    const existingFdRules = fieldInfo.component['fd:rules'] || {};
    const existingRules = existingFdRules.rules || [];

    // Add new rule to the list
    const allRules = [...existingRules, newRuleJson];

    // Transform ALL rules to scripts
    const scriptArray = [];
    for (const ruleJson of allRules) {
        try {
            // Deep clone before preprocessing to preserve original rule JSON
            const ruleClone = JSON.parse(JSON.stringify(ruleJson));
            // Preprocess to filter component types for primitive args
            preprocessFunctionCallTypes(ruleClone);
            const script = transformRuleToScript(ruleClone, options.contextData);
            scriptArray.push(script);
        } catch (e) {
            console.error(`Warning: Failed to transform rule: ${e.message}`);
        }
    }

    // Use AFJSONFormulaMerger to merge all scripts
    const mergedScripts = guidelib.author.AFJSONFormulaMerger.mergeScript(scriptArray);

    // Convert merged scripts to fd:events format
    const fdEvents = convertToFdEvents(mergedScripts, fieldId);

    // Prepare fd:rules (store rule JSONs for re-editing)
    const fdRules = { rules: allRules };

    // Update the field with fd:rules and fd:events
    fieldInfo.component['fd:rules'] = fdRules;
    fieldInfo.component['fd:events'] = fdEvents;

    // Save the form JSON (unless dry-run)
    if (!options.dryRun) {
        fs.writeFileSync(formJsonPath, JSON.stringify(formJson, null, 2));
    }

    return {
        success: true,
        mode: "form",
        field: fieldName,
        fieldPath: fieldId,
        rulesCount: allRules.length,
        formPath: formJsonPath,
        events: Object.keys(fdEvents),
        dryRun: options.dryRun || false,
        validationEnabled: !!(options.contextData && options.contextData.treeJson),
        fdEvents: fdEvents
    };
}

/**
 * Resave all rules in a rule store to regenerate fd:events
 */
function resaveRuleStore(ruleStorePath, formJsonPath, options = {}) {
    // Read existing rule store
    if (!fs.existsSync(ruleStorePath)) {
        throw new Error(`Rule store not found: ${ruleStorePath}`);
    }
    const ruleStore = JSON.parse(fs.readFileSync(ruleStorePath, 'utf-8'));

    // Auto-generate context from form.json
    const contextData = options.contextData || generateContextFromForm(formJsonPath);
    if (!contextData) {
        throw new Error('Failed to generate context from form.json');
    }

    const results = {
        success: true,
        mode: 'resave',
        ruleStoreFile: ruleStorePath,
        formFile: formJsonPath,
        components: [],
        totalRules: 0,
        errors: [],
        dryRun: options.dryRun || false
    };

    // Process each component in the rule store
    for (const [uuid, entry] of Object.entries(ruleStore)) {
        const componentName = entry.componentName;
        const fdRules = entry['fd:rules'] || {};
        const componentResult = {
            uuid,
            componentName,
            rulesProcessed: 0,
            events: []
        };

        // Collect all rules for this component and transform them
        const scriptArray = [];
        let fieldId = null;

        for (const [fdKey, rules] of Object.entries(fdRules)) {
            if (!fdKey.startsWith('fd:') || !Array.isArray(rules)) continue;

            for (const rule of rules) {
                try {
                    // Deep clone before preprocessing to preserve original rule JSON
                    const ruleClone = JSON.parse(JSON.stringify(rule));
                    // Preprocess to filter component types for primitive args
                    preprocessFunctionCallTypes(ruleClone);
                    const script = transformRuleToScript(ruleClone, contextData);
                    scriptArray.push(script);
                    if (!fieldId && script.field) {
                        fieldId = script.field;
                    }
                    componentResult.rulesProcessed++;
                    results.totalRules++;
                } catch (e) {
                    const errorMsg = `${componentName}/${fdKey}: ${e.message}`;
                    results.errors.push(errorMsg);
                    results.success = false;
                }
            }
        }

        // If we have scripts, merge and update fd:events
        if (scriptArray.length > 0 && fieldId) {
            const mergedScripts = guidelib.author.AFJSONFormulaMerger.mergeScript(scriptArray);
            const fdEvents = convertToFdEvents(mergedScripts, fieldId);

            // Preserve jcr:primaryType if it exists
            const existingPrimaryType = entry['fd:events']?.['jcr:primaryType'];
            entry['fd:events'] = {
                ...(existingPrimaryType ? { 'jcr:primaryType': existingPrimaryType } : {}),
                ...fdEvents
            };

            componentResult.events = Object.keys(fdEvents);
        }

        results.components.push(componentResult);
    }

    // Save the updated rule store (unless dry-run or errors)
    if (!options.dryRun && results.success) {
        fs.writeFileSync(ruleStorePath, JSON.stringify(ruleStore, null, 2));
    }

    return results;
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
    const result = {
        command: 'save',  // 'save' or 'resave'
        ruleFile: null,
        formFile: null,
        ruleStoreFile: null,
        contextFile: null,
        dryRun: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === 'resave') {
            result.command = 'resave';
        } else if (arg === '--dry-run') {
            result.dryRun = true;
        } else if (arg === '--context' && args[i + 1]) {
            result.contextFile = args[++i];
        } else if (arg === '--rule-store' && args[i + 1]) {
            result.ruleStoreFile = args[++i];
        } else if (arg === '--form' && args[i + 1]) {
            result.formFile = args[++i];
        } else if (!arg.startsWith('--')) {
            if (!result.ruleFile) {
                result.ruleFile = arg;
            } else if (!result.formFile) {
                // Legacy mode: second positional arg is form file
                result.formFile = arg;
            }
        }
    }

    return result;
}

/**
 * Print usage information
 */
function printUsage() {
    console.error(`Usage:
  Save rule (form-sync compatible):
    node save-rule.js <rule.json> --rule-store <store.rule.json> --form <form.json> [--dry-run]

  Resave all rules (regenerate fd:events for entire rule store):
    node save-rule.js resave --rule-store <store.rule.json> --form <form.json> [--dry-run]

  Form mode (legacy):
    node save-rule.js <rule.json> <form.json> [--dry-run]

Options:
  --rule-store <file>  Rule store file (form-sync format)
  --form <file>        Form JSON file (auto-generates context)
  --dry-run            Don't actually save, just show what would be saved
  --context <file>     Override auto-generated context (advanced)
`);
}

/**
 * Main CLI entry point
 */
function main() {
    const args = process.argv.slice(2);
    const parsedArgs = parseArgs(args);

    // Handle resave command
    if (parsedArgs.command === 'resave') {
        if (!parsedArgs.ruleStoreFile || !parsedArgs.formFile) {
            console.error('Error: resave requires --rule-store and --form');
            printUsage();
            process.exit(1);
        }

        try {
            let contextData = null;
            if (parsedArgs.contextFile) {
                contextData = ContextLoader.loadFromFile(parsedArgs.contextFile);
            }

            const result = resaveRuleStore(
                parsedArgs.ruleStoreFile,
                parsedArgs.formFile,
                {
                    dryRun: parsedArgs.dryRun,
                    contextData: contextData
                }
            );
            console.log(JSON.stringify(result, null, 2));
            if (!result.success) {
                process.exit(1);
            }
        } catch (error) {
            console.log(JSON.stringify({
                success: false,
                error: error.message,
                stack: process.env.DEBUG === 'true' ? error.stack : undefined
            }, null, 2));
            process.exit(1);
        }
        return;
    }

    // Save command - validate arguments
    if (!parsedArgs.ruleFile) {
        printUsage();
        process.exit(1);
    }

    const isRuleStoreMode = !!parsedArgs.ruleStoreFile;

    if (isRuleStoreMode) {
        if (!parsedArgs.formFile) {
            console.error('Error: --form is required when using --rule-store');
            printUsage();
            process.exit(1);
        }
    } else {
        if (!parsedArgs.formFile) {
            printUsage();
            process.exit(1);
        }
    }

    try {
        // Load context if provided, otherwise auto-generate from form.json
        let contextData = null;
        if (parsedArgs.contextFile) {
            contextData = ContextLoader.loadFromFile(parsedArgs.contextFile);
        } else if (parsedArgs.formFile) {
            contextData = generateContextFromForm(parsedArgs.formFile);
        }

        let result;
        if (isRuleStoreMode) {
            result = saveToRuleStore(
                parsedArgs.ruleFile,
                parsedArgs.ruleStoreFile,
                parsedArgs.formFile,
                {
                    dryRun: parsedArgs.dryRun,
                    contextData: contextData
                }
            );
        } else {
            result = saveToForm(
                parsedArgs.ruleFile,
                parsedArgs.formFile,
                {
                    dryRun: parsedArgs.dryRun,
                    contextData: contextData
                }
            );
        }

        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.log(JSON.stringify({
            success: false,
            error: error.message,
            stack: process.env.DEBUG === 'true' ? error.stack : undefined
        }, null, 2));
        process.exit(1);
    }
}

main();
