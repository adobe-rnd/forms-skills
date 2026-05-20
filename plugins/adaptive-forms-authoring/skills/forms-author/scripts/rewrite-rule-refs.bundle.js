#!/usr/bin/env node
var __import_meta_url__ = require("url").pathToFileURL(__filename).href;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// stub:./parsers/CustomFunctionParser.js
var require_CustomFunctionParser = __commonJS({
  "stub:./parsers/CustomFunctionParser.js"(exports2, module2) {
    module2.exports = {};
  }
});

// src/rewrite-rule-refs.js
var import_fs = require("fs");

// lib/content-model-walk.js
function sortedValues(itemsObj) {
  if (!itemsObj || typeof itemsObj !== "object") return [];
  return Object.entries(itemsObj).sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10)).map(([idx, entry]) => ({ idx, entry }));
}
function findFormRoot(contentModel2) {
  const top = sortedValues(contentModel2.items || {});
  const found = top.find(({ entry: e }) => e.properties?.fieldType === "form") || top[0];
  return found ? found.entry : null;
}
function walkItems(itemsObj, parentQualifiedId, parentCapiKey, parentPointer, depth, visitor) {
  for (const { idx, entry } of sortedValues(itemsObj)) {
    const name = entry.properties?.name || entry.id || "";
    const qualifiedId = parentQualifiedId ? `${parentQualifiedId}.${name}` : name;
    const capiKey = parentCapiKey ? `${parentCapiKey}:${idx}` : idx;
    const pointer = `${parentPointer}/items/${idx}`;
    visitor(entry, { name, qualifiedId, capiKey, pointer, depth });
    walkItems(entry.items || {}, qualifiedId, capiKey, pointer, depth + 1, visitor);
  }
}

// node_modules/@aemforms/rule-editor-transformer/src/grammar/GrammarConfig.js
var COMPONENT_NODE_NAMES = /* @__PURE__ */ new Set(["COMPONENT", "AFCOMPONENT", "VALUE_FIELD"]);
var BASE_STATEMENT_CHOICES = [
  "EVENT_SCRIPTS",
  "CALC_EXPRESSION",
  "FORMAT_EXPRESSION",
  "VALIDATE_EXPRESSION",
  "CLEAR_EXPRESSION",
  "VISIBLE_EXPRESSION",
  "SHOW_EXPRESSION",
  "ACCESS_EXPRESSION",
  "DISABLE_EXPRESSION"
];
var GrammarConfig = {
  // Root
  ROOT: {
    rule: "STATEMENT"
  },
  STATEMENT: {
    rule: BASE_STATEMENT_CHOICES.join(" | "),
    ftRule: {
      FT_FORMS_21264: {
        rule: [...BASE_STATEMENT_CHOICES, "TRIGGER_SCRIPTS"].join(" | "),
        allowBase: true
      }
    }
  },
  // Event Scripts (When-Then rules)
  EVENT_SCRIPTS: {
    rule: "EVENT_CONDITION Then BLOCK_STATEMENTS",
    ftRule: {
      FT_FORMS_12053: { rule: "EVENT_CONDITION Then BLOCK_STATEMENTS Else BLOCK_STATEMENTS", allowBase: true }
    }
  },
  EVENT_CONDITION: {
    rule: "EVENT_AND_COMPARISON | BINARY_EVENT_CONDITION"
  },
  EVENT_AND_COMPARISON: {
    rule: "COMPONENT EVENT_AND_COMPARISON_OPERATOR PRIMITIVE_EXPRESSION",
    ftRule: {
      FT_FORMS_19582: { rule: "EVENT_AND_COMPARISON_LEFT_HAND_EXPRESSION EVENT_AND_COMPARISON_OPERATOR PRIMITIVE_EXPRESSION", allowBase: true }
    }
  },
  EVENT_AND_COMPARISON_LEFT_HAND_EXPRESSION: {
    rule: "COMPONENT | FUNCTION_CALL"
  },
  EVENT_AND_COMPARISON_OPERATOR: {
    rule: "is changed | is clicked | is initialized | EQUALS_TO | NOT_EQUALS_TO | GREATER_THAN | LESS_THAN | HAS_SELECTED | STARTS_WITH | ENDS_WITH | CONTAINS | DOES_NOT_CONTAIN | IS_EMPTY | IS_NOT_EMPTY | IS_BEFORE | IS_AFTER | IS_TRUE | IS_FALSE | IS_VALID | IS_NOT_VALID | is submitted successfully | submission fails | is saved successfully | fails to save"
  },
  BINARY_EVENT_CONDITION: {
    rule: "EVENT_CONDITION OPERATOR EVENT_CONDITION",
    validOperators: {
      groups: ["LOGICAL"]
    }
  },
  // Block Statements (list of actions)
  BLOCK_STATEMENTS: {
    rule: "BLOCK_STATEMENT+"
  },
  BLOCK_STATEMENT: {
    // FT-gated alternatives (SAVE_FORM, NAVIGATE_IN_PANEL, WRITE_JSON_FORMULA, SET_VARIABLE,
    // ASYNC_FUNCTION_CALL) are listed here unconditionally but gated via FT_GATED_NODES in
    // RuleValidator — matching the pattern used for ASYNC_FUNCTION_CALL / FORMAT_EXPRESSION.
    rule: "HIDE_STATEMENT | SHOW_STATEMENT | ENABLE_STATEMENT | DISABLE_STATEMENT | SET_VALUE_STATEMENT | WSDL_STATEMENT | SET_PROPERTY | CLEAR_VALUE_STATEMENT | SET_FOCUS | SUBMIT_FORM | RESET_FORM | VALIDATE_FORM | ADD_INSTANCE | REMOVE_INSTANCE | FUNCTION_CALL | DISPATCH_EVENT | NAVIGATE_TO | SAVE_FORM | NAVIGATE_IN_PANEL | WRITE_JSON_FORMULA | SET_VARIABLE | ASYNC_FUNCTION_CALL"
  },
  // Statement types
  HIDE_STATEMENT: {
    rule: "AFCOMPONENT"
  },
  SHOW_STATEMENT: {
    rule: "AFCOMPONENT"
  },
  ENABLE_STATEMENT: {
    rule: "AFCOMPONENT"
  },
  DISABLE_STATEMENT: {
    rule: "AFCOMPONENT"
  },
  SET_VALUE_STATEMENT: {
    rule: "VALUE_FIELD to EXPRESSION"
  },
  CLEAR_VALUE_STATEMENT: {
    rule: "VALUE_FIELD"
  },
  SET_PROPERTY: {
    rule: "MEMBER_EXPRESSION to EXTENDED_EXPRESSION"
  },
  SET_FOCUS: {
    rule: "to AFCOMPONENT"
  },
  DISPATCH_EVENT: {
    rule: "STRING_LITERAL on AFCOMPONENT"
  },
  ADD_INSTANCE: {
    rule: "of REPEATABLE_COMPONENT"
  },
  REMOVE_INSTANCE: {
    rule: "of REPEATABLE_COMPONENT"
  },
  NAVIGATE_TO: {
    rule: "NAVIGATE_TO_EXPRESSION in NAVIGATE_METHOD_OPTIONS"
  },
  NAVIGATE_TO_EXPRESSION: {
    rule: "URL_LITERAL | COMPONENT | FUNCTION_CALL"
  },
  NAVIGATE_METHOD_OPTIONS: {
    rule: "NEW_WINDOW | NEW_TAB | SAME_TAB"
  },
  NAVIGATE_IN_PANEL: {
    rule: "PANEL_FOCUS_OPTION of PANEL"
  },
  PANEL_FOCUS_OPTION: {
    rule: "NEXT_ITEM | PREVIOUS_ITEM"
  },
  // Function call — rule type "function": { functionName: {id}, params: EXPRESSION[] }
  // impl and args are not stored in the AST — they are resolved from scope at transform time.
  // Each entry in params must be an EXPRESSION choice node (nodeName: 'EXPRESSION', choice: {...}).
  FUNCTION_CALL: {
    rule: "FUNCTION"
  },
  // Expressions
  EXPRESSION: {
    rule: "COMPONENT | STRING_LITERAL | NUMERIC_LITERAL | FUNCTION_CALL | BINARY_EXPRESSION | COMPARISON_EXPRESSION | MEMBER_EXPRESSION"
  },
  EXTENDED_EXPRESSION: {
    rule: "COMPONENT | DATE_LITERAL | STRING_LITERAL | BOOLEAN_LITERAL | NUMERIC_LITERAL | FUNCTION_CALL | BINARY_EXPRESSION | MEMBER_EXPRESSION"
  },
  PRIMITIVE_EXPRESSION: {
    rule: "STRING_LITERAL | NUMERIC_LITERAL | DATE_LITERAL | BOOLEAN_LITERAL"
  },
  BOOLEAN_LITERAL: {
    rule: "True | False"
  },
  COMPARISON_EXPRESSION: {
    rule: "EXPRESSION OPERATOR EXPRESSION",
    validOperators: {
      groups: ["COMPARISON", "STRING_COMPARISON", "UNARY"]
    }
  },
  BINARY_EXPRESSION: {
    rule: "EXPRESSION OPERATOR EXPRESSION",
    validOperators: {
      groups: ["ARITHMETIC", "STRING"]
    }
  },
  BOOLEAN_BINARY_EXPRESSION: {
    rule: "CONDITION OPERATOR CONDITION"
  },
  MEMBER_EXPRESSION: {
    rule: "PROPERTY_LIST of COMPONENT"
  },
  NUMBER_FORMAT_EXPRESSION: {
    rule: "STRING_LITERAL | FUNCTION_CALL | BINARY_EXPRESSION | MEMBER_EXPRESSION"
  },
  CONDITION: {
    rule: "COMPARISON_EXPRESSION | BOOLEAN_BINARY_EXPRESSION"
  },
  // Calculate/Clear/Format/Validate expressions
  CALC_EXPRESSION: {
    rule: "VALUE_FIELD to EXPRESSION When CONDITIONORALWAYS"
  },
  CLEAR_EXPRESSION: {
    rule: "VALUE_FIELD When CONDITIONORALWAYS"
  },
  FORMAT_EXPRESSION: {
    rule: "VALUE_FIELD Using Expression NUMBER_FORMAT_EXPRESSION"
  },
  VALIDATE_EXPRESSION: {
    rule: "AFCOMPONENT Using Expression CONDITION"
  },
  // Visibility/Enabled expressions (V2 baseline)
  VISIBLE_EXPRESSION: {
    rule: "AFCOMPONENT When CONDITIONORALWAYS Else DONOTHING_OR_SHOW"
  },
  SHOW_EXPRESSION: {
    rule: "AFCOMPONENT When CONDITIONORALWAYS Else DONOTHING_OR_HIDE"
  },
  ACCESS_EXPRESSION: {
    rule: "AFCOMPONENT When CONDITIONORALWAYS Else DONOTHING_OR_DISABLE"
  },
  DISABLE_EXPRESSION: {
    rule: "AFCOMPONENT When CONDITIONORALWAYS Else DONOTHING_OR_ENABLE"
  },
  // Conditional and else-action nodes (V2 baseline)
  CONDITIONORALWAYS: {
    rule: "COMPARISON_EXPRESSION | BOOLEAN_BINARY_EXPRESSION"
  },
  DONOTHING_OR_SHOW: {
    rule: "Show | No action"
  },
  DONOTHING_OR_HIDE: {
    rule: "Hide | No action"
  },
  DONOTHING_OR_ENABLE: {
    rule: "Enable | No action"
  },
  DONOTHING_OR_DISABLE: {
    rule: "Disable | No action"
  },
  // Dynamic variable rules — FT_FORMS_19884
  SET_VARIABLE: {
    rule: "key VARIABLE_NAME value VARIABLE_VALUE on AFCOMPONENT"
  },
  GET_VARIABLE: {
    rule: "key VARIABLE_NAME from AFCOMPONENT"
  },
  VARIABLE_NAME: {
    rule: "AFCOMPONENT | STRING_LITERAL | FUNCTION_CALL | GET_VARIABLE | BINARY_EXPRESSION"
  },
  VARIABLE_VALUE: {
    rule: "STRING_LITERAL | NUMERIC_LITERAL | BOOLEAN_LITERAL | AFCOMPONENT | FUNCTION_CALL | GET_VARIABLE | BINARY_EXPRESSION"
  },
  // JSON Formula write support — FT_FORMS_20655
  WRITE_JSON_FORMULA: {
    rule: "STRING_LITERAL"
  },
  // Async function call — FT_FORMS_13519
  ASYNC_FUNCTION_CALL: {
    rule: "FUNCTION"
  },
  // Component model (special terminal with metadata)
  // COMPONENT: {
  //   model: 'ComponentModel',
  // },
  // TRIGGER_SCRIPTS nodes (activated when FT_FORMS_21264 is on)
  TRIGGER_SCRIPTS: {
    rule: "SINGLE_TRIGGER_SCRIPTS+"
  },
  SINGLE_TRIGGER_SCRIPTS: {
    rule: "COMPONENT TRIGGER_EVENT When TRIGGER_EVENT_SCRIPTS"
  },
  // TRIGGER_EVENT has no rule entry — falls back to TerminalModel, reads .value directly
  TRIGGER_EVENT_SCRIPTS: {
    rule: "CONDITION Then BLOCK_STATEMENTS",
    ftRule: {
      FT_FORMS_12053: {
        rule: "CONDITION Then BLOCK_STATEMENTS Else BLOCK_STATEMENTS",
        allowBase: true
      }
    }
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/transformers/FieldTransformer.js
var FD_KEY_TO_EVENT = {
  "fd:click": "Click",
  "fd:init": "Initialize",
  "fd:valueCommit": "Value Commit",
  "fd:enabled": "Enabled",
  "fd:validate": "Validate",
  "fd:format": "Format",
  "fd:calc": "Calculate",
  "fd:visible": "Visibility",
  "fd:options": "Options",
  "fd:submitSuccess": "Successful Submission",
  "fd:submitError": "Error in Submission"
};
var RULE_AST_KEYS = Object.keys(FD_KEY_TO_EVENT);

// node_modules/@aemforms/rule-editor-transformer/src/index.js
var CustomFunctionParser = __toESM(require_CustomFunctionParser(), 1);

// node_modules/@aemforms/rule-editor-transformer/src/transformers/ruleAstUtils.js
function rewriteComponentRefs(node, oldId2, newId2) {
  if (!node || typeof node !== "object") {
    return node;
  }
  if (COMPONENT_NODE_NAMES.has(node.nodeName) && node.id === oldId2) {
    return { ...node, id: newId2 };
  }
  const result = { ...node };
  for (const [key, val] of Object.entries(node)) {
    if (Array.isArray(val)) {
      result[key] = val.map((item) => typeof item === "object" && item !== null ? rewriteComponentRefs(item, oldId2, newId2) : item);
    } else if (typeof val === "object" && val !== null) {
      result[key] = rewriteComponentRefs(val, oldId2, newId2);
    }
  }
  return result;
}

// src/rewrite-rule-refs.js
function findFdRulesChild(itemsObj) {
  if (!itemsObj || typeof itemsObj !== "object") return null;
  for (const val of Object.values(itemsObj)) {
    if (val.id === "fd:rules" || val.componentType === "fd:rules") return val;
  }
  return null;
}
function rewriteRuleRefs(contentModel2, oldId2, newId2) {
  const formRoot = findFormRoot(contentModel2);
  if (!formRoot) return [];
  const formRootCapiKey = formRoot["capi-key"] || "0";
  const formRootPointer = formRootCapiKey.split(":").map((s) => `/items/${s}`).join("");
  const rewrites2 = [];
  walkItems(formRoot.items || {}, "$form", formRootCapiKey, formRootPointer, 1, (entry, ctx) => {
    const rulesNode = findFdRulesChild(entry.items);
    if (!rulesNode) return;
    const ruleSource = rulesNode.properties || rulesNode;
    for (const fdKey of RULE_AST_KEYS) {
      const astArray = ruleSource[fdKey];
      if (!Array.isArray(astArray) || astArray.length === 0) continue;
      let ast;
      try {
        ast = JSON.parse(astArray[0]);
      } catch {
        continue;
      }
      const rewritten = rewriteComponentRefs(ast, oldId2, newId2);
      if (JSON.stringify(rewritten) === JSON.stringify(ast)) continue;
      const capiKey = entry["capi-key"] || ctx.capiKey;
      rewrites2.push({
        fieldName: ctx.name,
        capiKey,
        pointer: capiKey.split(":").map((s) => `/items/${s}`).join(""),
        fdKey,
        rewrittenAst: rewritten
      });
    }
  });
  return rewrites2;
}
var args = process.argv.slice(2);
var get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : void 0;
};
var contentModelJson = get("--content-model");
var contentModelFile = get("--content-model-file");
var oldId = get("--old-id");
var newId = get("--new-id");
if (!contentModelJson && !contentModelFile || !oldId || !newId) {
  process.stderr.write(
    "Usage: node rewrite-rule-refs.bundle.js --content-model <json> --old-id <id> --new-id <id>\n       node rewrite-rule-refs.bundle.js --content-model-file <path> --old-id <id> --new-id <id>\n"
  );
  process.exit(2);
}
var contentModel;
try {
  const isFilePath = (s) => typeof s === "string" && (s.startsWith("/") || s.startsWith("./") || s.startsWith("~/"));
  const raw = contentModelJson && !isFilePath(contentModelJson) ? contentModelJson : (0, import_fs.readFileSync)(contentModelFile || contentModelJson, "utf8");
  const parsed = JSON.parse(raw);
  contentModel = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
} catch (err) {
  process.stderr.write("Error: could not parse content model: " + err.message + "\n");
  process.exit(1);
}
var rewrites = rewriteRuleRefs(contentModel, oldId, newId);
process.stdout.write(JSON.stringify(rewrites, null, 2) + "\n");
process.exit(0);
