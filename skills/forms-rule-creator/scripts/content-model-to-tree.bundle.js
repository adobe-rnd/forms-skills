#!/usr/bin/env node
var __import_meta_url__ = require('url').pathToFileURL(__filename).href;
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

// stub:stub:CustomFunctionParser
var require_stub_CustomFunctionParser = __commonJS({
  "stub:stub:CustomFunctionParser"(exports2, module2) {
    module2.exports = {};
  }
});

// scripts/src/content-model-to-tree.js
var import_fs = require("fs");

// node_modules/@aemforms/rule-editor-transformer/src/scope/jcrToScopeTree.js
var DEFAULT_INPUT_PATH = "jcr:content/guideContainer";
function isFieldNode(key, value) {
  return typeof value === "object" && value !== null && "fieldType" in value && !key.startsWith("jcr:") && !key.startsWith("sling:");
}
function jcrNodeToFormJson(jcrNode, keyName) {
  const childItems = Object.entries(jcrNode).filter(([k, v]) => isFieldNode(k, v)).map(([k, v]) => jcrNodeToFormJson(v, k));
  const node = {
    fieldType: jcrNode.fieldType,
    name: (typeof jcrNode.name === "string" ? jcrNode.name : null) || keyName,
    jcrKey: keyName,
    type: jcrNode.type,
    repeatable: jcrNode.repeatable,
    properties: {
      "fd:path": jcrNode["fd:path"],
      "fd:rules": { validationStatus: "none" }
    }
  };
  if (jcrNode["jcr:title"]) {
    node.label = { value: jcrNode["jcr:title"] };
  }
  if (jcrNode.enum) {
    node.enum = jcrNode.enum;
  }
  if (jcrNode.enumNames) {
    node.enumNames = jcrNode.enumNames;
  }
  if (childItems.length > 0) {
    node.items = childItems;
  }
  return node;
}
function buildFormJson(formData) {
  const formName = formData.formPath?.split("/").pop() || "FORM";
  const items = Object.entries(formData).filter(([k, v]) => isFieldNode(k, v)).map(([k, v]) => jcrNodeToFormJson(v, k));
  return {
    fieldType: "form",
    name: formName,
    title: formData.title,
    adaptiveform: formData["fd:version"],
    id: formData.formPath || "",
    properties: {
      "fd:path": formData.formPath || "",
      "fd:rules": { validationStatus: "none" }
    },
    items
  };
}
function addPathsToFormJson(node, formPath, inputPath = DEFAULT_INPUT_PATH, jsonPath = "", isRoot = false) {
  if (!node || typeof node !== "object") {
    return node;
  }
  if (formPath && node.properties) {
    let fullPath;
    if (isRoot) {
      fullPath = formPath;
    } else if (jsonPath) {
      fullPath = `${formPath}/${inputPath}/${jsonPath}`;
    } else {
      fullPath = `${formPath}/${inputPath}`;
    }
    node.properties["fd:path"] = fullPath;
  }
  if (node.items && Array.isArray(node.items)) {
    node.items.forEach((childNode) => {
      const childKey = childNode.jcrKey || childNode.name || "";
      const childJsonPath = jsonPath ? `${jsonPath}/${childKey}` : childKey;
      addPathsToFormJson(childNode, formPath, inputPath, childJsonPath, false);
    });
  }
  return node;
}

// node_modules/@aemforms/rule-editor-transformer/src/scope/fieldTypeUtils.js
var SITES_PANEL_TYPES = /* @__PURE__ */ new Set([
  "panelcontainer",
  "accordion",
  "wizard",
  "tabsontop",
  "verticaltabs",
  "fragment",
  "review"
]);
function isFieldNode2(node) {
  const panelTypes = /* @__PURE__ */ new Set(["panel", "form", "pageset", "pagearea", ...SITES_PANEL_TYPES]);
  return node.fieldType && !panelTypes.has(node.fieldType);
}
function mapFieldType(node, isAncestorRepeatable) {
  const { fieldType } = node;
  if (fieldType === "form") {
    return "FORM";
  }
  if (fieldType === "panel" || SITES_PANEL_TYPES.has(fieldType)) {
    return node.type === "object" ? "AFCOMPONENT|PANEL|OBJECT" : "AFCOMPONENT|PANEL";
  }
  if (fieldType === "plain-text") {
    return "AFCOMPONENT|STATIC TEXT|STRING";
  }
  if (fieldType === "image") {
    return "AFCOMPONENT|IMAGE|STRING";
  }
  if (fieldType === "button") {
    return "AFCOMPONENT|FIELD|BUTTON";
  }
  const dataTypeMap = {
    string: "STRING",
    number: "NUMBER",
    boolean: "BOOLEAN",
    date: "DATE",
    object: "OBJECT",
    file: "BINARY|FILE",
    "string[]": "STRING[]",
    "number[]": "NUMBER[]",
    "date[]": "DATE[]"
  };
  const categoryMap = {
    "text-input": "FIELD|TEXT FIELD",
    "multiline-input": "FIELD|TEXT FIELD",
    email: "FIELD|TEXT FIELD",
    "telephone-input": "FIELD|TEXT FIELD",
    "number-input": "FIELD|NUMBER FIELD",
    "date-input": "FIELD|DATE FIELD",
    "file-input": "FIELD|FILE ATTACHMENT",
    "drop-down": "FIELD|DROPDOWN",
    "radio-group": "FIELD|RADIO BUTTON",
    checkbox: "FIELD",
    "checkbox-group": "FIELD|CHECK BOX"
  };
  const fieldTypeDefaultDataType = {
    "text-input": "string",
    "multiline-input": "string",
    email: "string",
    "telephone-input": "string",
    "drop-down": "string",
    "radio-group": "string",
    checkbox: "string",
    "checkbox-group": "string[]",
    "file-input": "file"
  };
  const category = categoryMap[fieldType] || "FIELD";
  let effectiveNodeType;
  if (fieldType === "date-input") {
    effectiveNodeType = "date";
  } else if (fieldType === "number-input") {
    effectiveNodeType = node.type === "integer" ? "number" : node.type || "number";
  } else {
    effectiveNodeType = node.type || fieldTypeDefaultDataType[fieldType];
  }
  const dataType = dataTypeMap[effectiveNodeType] || "";
  const typeStr = dataType ? `AFCOMPONENT|${category}|${dataType}` : `AFCOMPONENT|${category}`;
  if (isAncestorRepeatable && isFieldNode2(node) && dataType && !dataType.endsWith("[]")) {
    return `${typeStr}|${dataType}[]`;
  }
  return typeStr;
}

// node_modules/@aemforms/rule-editor-transformer/src/scope/contentModelToScopeTree.js
function sortedContentModelValues(itemsObj) {
  if (!itemsObj || typeof itemsObj !== "object") {
    return [];
  }
  return Object.entries(itemsObj).sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10)).map(([idx, entry]) => ({ idx, entry }));
}
function buildContentModelItems(itemsObj, parentQualifiedId, isAncestorRepeatable = false) {
  return sortedContentModelValues(itemsObj).map(({ entry }) => {
    const props = entry.properties || {};
    const name = props.name || entry.id || "";
    const displayName = props["jcr:title"] || name;
    const fieldType = props.fieldType || "";
    const type = mapFieldType({ fieldType, type: props.type }, isAncestorRepeatable);
    const qualifiedId = `${parentQualifiedId}.${name}`;
    const isPanel = !isFieldNode2({ fieldType });
    return {
      id: qualifiedId,
      name,
      displayName,
      type,
      fieldType,
      path: "",
      // content model carries no fd:path; consumers must resolve via JCR if needed
      items: buildContentModelItems(
        entry.items || {},
        qualifiedId,
        isAncestorRepeatable || isPanel && props.repeatable === true
      )
    };
  });
}
function contentModelToScopeTree(contentModel2) {
  const sorted = sortedContentModelValues(contentModel2?.items);
  if (sorted.length === 0) {
    throw new Error("Content model has no items \u2014 cannot build treeJson.");
  }
  const formEntry = sorted.find(({ entry }) => entry?.properties?.fieldType === "form") || sorted[0];
  const formRoot = formEntry.entry;
  const props = formRoot.properties || {};
  const rootName = props.name || "guideContainer";
  const rootTitle = props["jcr:title"] || "";
  return {
    id: "$form",
    name: rootName,
    displayName: rootTitle,
    type: "FORM",
    fieldType: "form",
    path: "",
    items: buildContentModelItems(formRoot.items || {}, "$form")
  };
}

// node_modules/@aemforms/rule-editor-transformer/src/scope/ScopeBuilder.js
var ScopeBuilder = class _ScopeBuilder {
  /**
   * Main entry point - transforms form JSON to tree JSON
   * @param {Object} formJson - AEM Forms definition
   * @returns {Object} treeJson structure
   */
  buildTreeFromForm(formJson) {
    const tree = this.transformNode(formJson, {
      parentPath: "",
      parentType: "object",
      isParentRepeatable: false,
      isAncestorRepeatable: false
    }, 0);
    if (formJson.adaptiveform) {
      tree.adaptiveFormVersion = formJson.adaptiveform;
    }
    tree.options = {
      originalId: formJson.id || "",
      schemaRef: formJson.properties?.["fd:schemaRef"] || "",
      schemaType: ""
    };
    return tree;
  }
  /**
   * Transform individual node
   * @param {Object} node - Node to transform
   * @param {Object} context - Transformation context
   * @param {number} index - Index for array items
   * @returns {Object|null} Tree node or null for unnamed leaf nodes
   */
  transformNode(node, context, index = 0) {
    if (!node.fieldType && !_ScopeBuilder.isSiteContainer(node)) {
      return null;
    }
    if (_ScopeBuilder.isSiteContainer(node)) {
      return this.processContainer(context.parentPath, node, context.isAncestorRepeatable);
    }
    const treeNode = _ScopeBuilder.buildTreeNode(node, context.isAncestorRepeatable);
    const isUnnamed = node.name == null || node.name === "";
    treeNode.id = _ScopeBuilder.calculateNodeId(treeNode, context, isUnnamed, index);
    if (_ScopeBuilder.isLeafNode(node)) {
      if (isUnnamed) {
        return null;
      }
      return treeNode;
    }
    const isRepeatable = _ScopeBuilder.isRepeatable(node);
    const newAncestorRepeatable = context.isAncestorRepeatable || isRepeatable;
    treeNode.items = this.processContainer(treeNode.id, node, newAncestorRepeatable);
    treeNode.isFragment = node.properties?.["fd:fragment"] || false;
    return treeNode;
  }
  /**
   * Build tree node structure
   * @param {Object} node - Node to build from
   * @param {boolean} isAncestorRepeatable - Whether ancestor is repeatable
   * @returns {Object} Tree node with metadata
   */
  static buildTreeNode(node, isAncestorRepeatable) {
    const treeNode = {
      id: node.id || node.name || "$form",
      name: node.name || "FORM",
      displayName: node.label?.value || node.name || "FORM",
      type: _ScopeBuilder.mapFieldType(node, isAncestorRepeatable),
      fieldType: node.fieldType,
      path: node.properties?.["fd:path"],
      status: node.properties?.["fd:rules"]?.validationStatus || "none",
      isAncestorRepeatable
    };
    if (Array.isArray(node.enum) && node.enum.length > 0) {
      const names = node.enumNames || node.enum;
      treeNode.options = Object.fromEntries(node.enum.map((k, i) => [k, names[i]]));
    }
    return treeNode;
  }
  /**
   * Calculate node ID based on context
   * @param {Object} treeNode - Tree node being built
   * @param {Object} context - Transformation context
   * @param {boolean} isUnnamed - Whether node is unnamed
   * @param {number} index - Index for array items
   * @returns {string} Calculated node ID
   */
  static calculateNodeId(treeNode, context, isUnnamed, index) {
    const { parentPath, parentType, isParentRepeatable } = context;
    if (parentPath === "") {
      return "$form";
    }
    if (isParentRepeatable && !isUnnamed) {
      return `${parentPath}[getRelativeInstanceIndex(${parentPath})].${_ScopeBuilder.sanitizeFieldName(treeNode.name)}`;
    }
    if (parentType !== "array" && !isUnnamed) {
      return `${parentPath}.${_ScopeBuilder.sanitizeFieldName(treeNode.name)}`;
    }
    if (parentType === "array") {
      return `${parentPath}[${index}]`;
    }
    if (isUnnamed) {
      return parentPath;
    }
    return treeNode.id;
  }
  /**
   * Map fieldType to the legacy pipe-separated type string.
   * Delegates to the standalone mapFieldType utility in fieldTypeUtils.js.
   *
   * @param {Object} node - Form.json node (fieldType + type properties)
   * @param {boolean} isAncestorRepeatable - Whether an ancestor panel is repeatable
   * @returns {string} Legacy type string e.g. "AFCOMPONENT|FIELD|TEXT FIELD|STRING"
   */
  static mapFieldType(node, isAncestorRepeatable) {
    return mapFieldType(node, isAncestorRepeatable);
  }
  /**
   * Check if node is a field (not container)
   * @param {Object} node - Node to check
   * @returns {boolean} True if field node
   */
  static isFieldNode(node) {
    return isFieldNode2(node);
  }
  /**
   * Process container and transform children
   * @param {string} parentPath - Parent node path
   * @param {Object} container - Container node
   * @param {boolean} isAncestorRepeatable - Whether ancestor is repeatable
   * @returns {Array} Array of transformed child nodes
   */
  processContainer(parentPath, container, isAncestorRepeatable) {
    const oldItems = container.items instanceof Array ? container.items : [];
    const cqItems = container[":items"] ? container[":items"] : {};
    const cqItemsOrder = container[":itemsOrder"] ? container[":itemsOrder"] : [];
    const items = oldItems.length > 0 ? oldItems : cqItemsOrder.map((key) => cqItems[key]);
    const isRepeatable = _ScopeBuilder.isRepeatable(container);
    return items.map((item, index) => {
      const context = {
        parentPath,
        parentType: container.type,
        isParentRepeatable: isRepeatable,
        isAncestorRepeatable
      };
      return this.transformNode(item, context, index);
    }).flat().filter((item) => item != null);
  }
  /**
   * Check if node is a site container
   * @param {Object} node - Node to check
   * @returns {boolean} True if site container
   */
  static isSiteContainer(node) {
    return (":items" in node || "items" in node) && !("fieldType" in node);
  }
  /**
   * Check if node is a leaf node
   * @param {Object} node - Node to check
   * @returns {boolean} True if leaf node
   */
  static isLeafNode(node) {
    return node.fieldType && ["panel", "form", "pageset", "pagearea"].indexOf(node.fieldType) === -1;
  }
  /**
   * Check if node is repeatable
   * @param {Object} node - Node to check
   * @returns {boolean} True if repeatable
   */
  static isRepeatable(node) {
    return node.repeatable === true;
  }
  /**
   * Sanitize field name for safe use in expressions
   * @param {string} name - Field name to sanitize
   * @returns {string} Sanitized name
   */
  static sanitizeFieldName(name) {
    const nameRegex = /^[A-Za-z][A-Za-z0-9_]*$/;
    if (!nameRegex.test(name)) {
      return `"${name}"`;
    }
    return name;
  }
  /**
   * Get repeatable index expression
   * @param {string} parentPath - Parent path
   * @returns {string} Index expression
   */
  static getRepeatableIndexExpression(parentPath) {
    return `getRelativeInstanceIndex(${parentPath})`;
  }
  /**
   * Build treeJson directly from a raw JCR JSON export.
   * @param {Object} jcrJson - Raw JCR JSON with formPath and field nodes
   * @returns {Object} treeJson structure
   */
  static fromJCR(jcrJson) {
    const guideContainer = jcrJson?.["jcr:content"]?.guideContainer;
    const formData = guideContainer ? { ...guideContainer, formPath: jcrJson.formPath } : jcrJson;
    const formJson = buildFormJson(formData);
    addPathsToFormJson(formJson, formData.formPath, DEFAULT_INPUT_PATH, "", true);
    return new _ScopeBuilder().buildTreeFromForm(formJson);
  }
  /**
   * Build treeJson from an AEM Sites Content API content model.
   * Use this instead of fromJCR when you have a content model from
   * get-aem-page-content rather than a raw JCR infinity.json export.
   *
   * @param {Object} contentModel - Content model from get-aem-page-content
   * @returns {Object} treeJson compatible with RBScope
   */
  static fromContentModel(contentModel2) {
    return contentModelToScopeTree(contentModel2);
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/scope/TypesRegistry.js
var DEFAULT_TYPES_CONFIG = {
  AFCOMPONENT: {
    vars: {
      visible: { name: "visible", type: "BOOLEAN", readOnly: "false" },
      "label.value": { name: "label", type: "STRING", readOnly: "false" },
      "label.visible": { name: "label", type: "BOOLEAN", readOnly: "false" },
      description: { name: "description", type: "STRING", readOnly: "false" },
      properties: { name: "properties", type: "OBJECT", readOnly: "false" },
      tooltip: { name: "tooltip", type: "STRING", readOnly: "true" },
      repeatable: { name: "repeatable", type: "BOOLEAN", readOnly: "true" }
    }
  },
  FIELD: {
    inherits: "AFCOMPONENT",
    vars: {
      dataRef: { name: "dataRef", type: "STRING", readOnly: "true" },
      fieldType: { name: "fieldType", type: "STRING", readOnly: "true" },
      type: { name: "type", type: "STRING", readOnly: "true" },
      lang: { name: "lang", type: "STRING", readOnly: "true" },
      enabled: { name: "enabled", type: "BOOLEAN", readOnly: "false" },
      value: { name: "value", type: "OBJECT|STRING|NUMBER|DATE|BOOLEAN", readOnly: "false" },
      name: { name: "name", type: "STRING", readOnly: "true" },
      readOnly: { name: "readOnly", type: "BOOLEAN", readOnly: "false" },
      required: { name: "required", type: "BOOLEAN", readOnly: "false" },
      screenReaderText: { name: "screenReaderText", type: "STRING", readOnly: "true" },
      valid: { name: "valid", type: "BOOLEAN", readOnly: "false" },
      errorMessage: { name: "errorMessage", type: "STRING", readOnly: "false" },
      placeholder: { name: "placeholder", type: "STRING", readOnly: "false" }
    }
  },
  BUTTON: { inherits: "AFCOMPONENT" },
  "NUMBER FIELD": {
    inherits: "FIELD",
    vars: {
      default: { name: "default", type: "NUMBER", readOnly: "true" },
      minimum: { name: "minimum", type: "NUMBER", readOnly: "false" },
      maximum: { name: "maximum", type: "NUMBER", readOnly: "false" },
      minimumMessage: { name: "minimumMessage", type: "STRING", readOnly: "false" },
      maximumMessage: { name: "maximumMessage", type: "STRING", readOnly: "false" }
    }
  },
  "TEXT FIELD": {
    inherits: "FIELD",
    vars: {
      default: { name: "default", type: "STRING", readOnly: "true" }
    }
  },
  "DATE FIELD": {
    inherits: "FIELD",
    vars: {
      default: { name: "default", type: "DATE", readOnly: "true" },
      minimum: { name: "minimum", type: "DATE", readOnly: "false" },
      maximum: { name: "maximum", type: "DATE", readOnly: "false" },
      minimumMessage: { name: "minimumMessage", type: "STRING", readOnly: "false" },
      maximumMessage: { name: "maximumMessage", type: "STRING", readOnly: "false" }
    }
  },
  "PASSWORD FIELD": {
    inherits: "FIELD",
    vars: {
      default: { name: "default", type: "STRING", readOnly: "true" }
    }
  },
  DROPDOWN: {
    inherits: "FIELD",
    vars: {
      enum: { name: "enum", type: "STRING[]|NUMBER[]|ARRAY", readOnly: "false" },
      enumNames: { name: "enumNames", type: "STRING[]", readOnly: "false" },
      default: { name: "default", type: "STRING", readOnly: "true" }
    }
  },
  "RADIO BUTTON": {
    inherits: "FIELD",
    vars: {
      enum: { name: "enum", type: "STRING[]|NUMBER[]|ARRAY", readOnly: "false" },
      enumNames: { name: "enumNames", type: "STRING[]", readOnly: "false" },
      default: { name: "default", type: "STRING", readOnly: "true" }
    }
  },
  "CHECK BOX": {
    inherits: "FIELD",
    vars: {
      enum: { name: "enum", type: "STRING[]|NUMBER[]|ARRAY", readOnly: "false" },
      enumNames: { name: "enumNames", type: "STRING[]", readOnly: "false" },
      default: { name: "default", type: "STRING", readOnly: "true" }
    }
  },
  SWITCH: {
    inherits: "FIELD",
    vars: {
      default: { name: "default", type: "STRING", readOnly: "true" }
    }
  },
  PANEL: {
    inherits: "AFCOMPONENT",
    vars: {
      valid: { name: "valid", type: "BOOLEAN", readOnly: "true" },
      enabled: { name: "enabled", type: "BOOLEAN", readOnly: "false" },
      title: { name: "title", type: "STRING", readOnly: "false" }
    }
  },
  FORM: {}
};
var toTypeTokens = (typeValue) => {
  if (Array.isArray(typeValue)) {
    return typeValue.flatMap((value) => String(value).split("|")).map((value) => value.trim()).filter(Boolean);
  }
  if (typeof typeValue === "string") {
    return typeValue.split("|").map((value) => value.trim()).filter(Boolean);
  }
  return [];
};
var TypesRegistry = class {
  constructor(typesConfig = DEFAULT_TYPES_CONFIG) {
    this.types = typesConfig;
  }
  getType(typeName) {
    return this.types[typeName];
  }
  getAllowedPropertiesForType(typeValue) {
    const typeTokens = toTypeTokens(typeValue);
    const targetTypes = typeTokens.length > 0 ? typeTokens : ["FIELD"];
    const merged = targetTypes.reduce((acc, typeName) => {
      this._collectTypeVars(typeName).forEach((propertyName) => acc.add(propertyName));
      return acc;
    }, /* @__PURE__ */ new Set());
    return [...merged];
  }
  isPropertyAllowed(typeValue, propertyName) {
    if (typeof propertyName !== "string") {
      return true;
    }
    const allowedProperties = this.getAllowedPropertiesForType(typeValue);
    return allowedProperties.includes(propertyName);
  }
  _collectTypeVars(typeName, visited = /* @__PURE__ */ new Set()) {
    if (!typeName || visited.has(typeName)) {
      return /* @__PURE__ */ new Set();
    }
    const typeConfig = this.getType(typeName);
    if (!typeConfig) {
      return /* @__PURE__ */ new Set();
    }
    const nextVisited = /* @__PURE__ */ new Set([...visited, typeName]);
    const inheritedVars = typeConfig.inherits ? this._collectTypeVars(typeConfig.inherits, nextVisited) : /* @__PURE__ */ new Set();
    const ownVars = new Set(Object.keys(typeConfig.vars || {}));
    return /* @__PURE__ */ new Set([...inheritedVars, ...ownVars]);
  }
};

// node_modules/@adobe/json-formula/src/jmespath/dataTypes.js
var dataTypes_default = {
  TYPE_NUMBER: 0,
  TYPE_ANY: 1,
  TYPE_STRING: 2,
  TYPE_ARRAY: 3,
  TYPE_OBJECT: 4,
  TYPE_BOOLEAN: 5,
  TYPE_EXPREF: 6,
  TYPE_NULL: 7,
  TYPE_ARRAY_NUMBER: 8,
  TYPE_ARRAY_STRING: 9,
  TYPE_CLASS: 10,
  TYPE_ARRAY_ARRAY: 11
};

// node_modules/@adobe/json-formula/src/jmespath/tokenDefinitions.js
var tokenDefinitions_default = {
  TOK_EOF: "EOF",
  TOK_UNQUOTEDIDENTIFIER: "UnquotedIdentifier",
  TOK_QUOTEDIDENTIFIER: "QuotedIdentifier",
  TOK_RBRACKET: "Rbracket",
  TOK_RPAREN: "Rparen",
  TOK_COMMA: "Comma",
  TOK_COLON: "Colon",
  TOK_CONCATENATE: "Concatenate",
  TOK_RBRACE: "Rbrace",
  TOK_NUMBER: "Number",
  TOK_CURRENT: "Current",
  TOK_GLOBAL: "Global",
  TOK_FIELD: "Field",
  TOK_EXPREF: "Expref",
  TOK_PIPE: "Pipe",
  TOK_OR: "Or",
  TOK_AND: "And",
  TOK_ADD: "Add",
  TOK_SUBTRACT: "Subtract",
  TOK_UNARY_MINUS: "UnaryMinus",
  TOK_MULTIPLY: "Multiply",
  TOK_POWER: "Power",
  TOK_UNION: "Union",
  TOK_DIVIDE: "Divide",
  TOK_EQ: "EQ",
  TOK_GT: "GT",
  TOK_LT: "LT",
  TOK_GTE: "GTE",
  TOK_LTE: "LTE",
  TOK_NE: "NE",
  TOK_FLATTEN: "Flatten",
  TOK_STAR: "Star",
  TOK_FILTER: "Filter",
  TOK_DOT: "Dot",
  TOK_NOT: "Not",
  TOK_LBRACE: "Lbrace",
  TOK_LBRACKET: "Lbracket",
  TOK_LPAREN: "Lparen",
  TOK_LITERAL: "Literal"
};

// node_modules/@adobe/json-formula/src/jmespath/matchType.js
var {
  TYPE_NUMBER,
  TYPE_ANY,
  TYPE_STRING,
  TYPE_ARRAY,
  TYPE_OBJECT,
  TYPE_BOOLEAN,
  TYPE_EXPREF,
  TYPE_NULL,
  TYPE_ARRAY_NUMBER,
  TYPE_ARRAY_STRING,
  TYPE_CLASS,
  TYPE_ARRAY_ARRAY
} = dataTypes_default;
var {
  TOK_EXPREF
} = tokenDefinitions_default;
var TYPE_NAME_TABLE = {
  [TYPE_NUMBER]: "number",
  [TYPE_ANY]: "any",
  [TYPE_STRING]: "string",
  [TYPE_ARRAY]: "array",
  [TYPE_OBJECT]: "object",
  [TYPE_BOOLEAN]: "boolean",
  [TYPE_EXPREF]: "expression",
  [TYPE_NULL]: "null",
  [TYPE_ARRAY_NUMBER]: "Array<number>",
  [TYPE_ARRAY_STRING]: "Array<string>",
  [TYPE_CLASS]: "class",
  [TYPE_ARRAY_ARRAY]: "Array<array>"
};

// node_modules/@adobe/json-formula/src/jmespath/TreeInterpreter.js
var {
  TOK_CURRENT,
  TOK_GLOBAL,
  TOK_EXPREF: TOK_EXPREF2,
  TOK_PIPE,
  TOK_EQ,
  TOK_GT,
  TOK_LT,
  TOK_GTE,
  TOK_LTE,
  TOK_NE,
  TOK_FLATTEN
} = tokenDefinitions_default;
var {
  TYPE_STRING: TYPE_STRING2,
  TYPE_ARRAY_STRING: TYPE_ARRAY_STRING2,
  TYPE_ARRAY: TYPE_ARRAY2
} = dataTypes_default;

// node_modules/@adobe/json-formula/src/jmespath/Lexer.js
var {
  TOK_UNQUOTEDIDENTIFIER,
  TOK_QUOTEDIDENTIFIER,
  TOK_RBRACKET,
  TOK_RPAREN,
  TOK_COMMA,
  TOK_COLON,
  TOK_CONCATENATE,
  TOK_RBRACE,
  TOK_NUMBER,
  TOK_CURRENT: TOK_CURRENT2,
  TOK_GLOBAL: TOK_GLOBAL2,
  TOK_EXPREF: TOK_EXPREF3,
  TOK_PIPE: TOK_PIPE2,
  TOK_OR,
  TOK_AND,
  TOK_ADD,
  TOK_SUBTRACT,
  TOK_UNARY_MINUS,
  TOK_MULTIPLY,
  TOK_POWER,
  TOK_DIVIDE,
  TOK_UNION,
  TOK_EQ: TOK_EQ2,
  TOK_GT: TOK_GT2,
  TOK_LT: TOK_LT2,
  TOK_GTE: TOK_GTE2,
  TOK_LTE: TOK_LTE2,
  TOK_NE: TOK_NE2,
  TOK_FLATTEN: TOK_FLATTEN2,
  TOK_STAR,
  TOK_FILTER,
  TOK_DOT,
  TOK_NOT,
  TOK_LBRACE,
  TOK_LBRACKET,
  TOK_LPAREN,
  TOK_LITERAL
} = tokenDefinitions_default;

// node_modules/@adobe/json-formula/src/jmespath/Parser.js
var {
  TOK_LITERAL: TOK_LITERAL2,
  TOK_COLON: TOK_COLON2,
  TOK_EOF,
  TOK_UNQUOTEDIDENTIFIER: TOK_UNQUOTEDIDENTIFIER2,
  TOK_QUOTEDIDENTIFIER: TOK_QUOTEDIDENTIFIER2,
  TOK_RBRACKET: TOK_RBRACKET2,
  TOK_RPAREN: TOK_RPAREN2,
  TOK_COMMA: TOK_COMMA2,
  TOK_CONCATENATE: TOK_CONCATENATE2,
  TOK_RBRACE: TOK_RBRACE2,
  TOK_NUMBER: TOK_NUMBER2,
  TOK_CURRENT: TOK_CURRENT3,
  TOK_GLOBAL: TOK_GLOBAL3,
  TOK_FIELD,
  TOK_EXPREF: TOK_EXPREF4,
  TOK_PIPE: TOK_PIPE3,
  TOK_OR: TOK_OR2,
  TOK_AND: TOK_AND2,
  TOK_ADD: TOK_ADD2,
  TOK_SUBTRACT: TOK_SUBTRACT2,
  TOK_UNARY_MINUS: TOK_UNARY_MINUS2,
  TOK_MULTIPLY: TOK_MULTIPLY2,
  TOK_POWER: TOK_POWER2,
  TOK_DIVIDE: TOK_DIVIDE2,
  TOK_UNION: TOK_UNION2,
  TOK_EQ: TOK_EQ3,
  TOK_GT: TOK_GT3,
  TOK_LT: TOK_LT3,
  TOK_GTE: TOK_GTE3,
  TOK_LTE: TOK_LTE3,
  TOK_NE: TOK_NE3,
  TOK_FLATTEN: TOK_FLATTEN3,
  TOK_STAR: TOK_STAR2,
  TOK_FILTER: TOK_FILTER2,
  TOK_DOT: TOK_DOT2,
  TOK_NOT: TOK_NOT2,
  TOK_LBRACE: TOK_LBRACE2,
  TOK_LBRACKET: TOK_LBRACKET2,
  TOK_LPAREN: TOK_LPAREN2
} = tokenDefinitions_default;
var bindingPower = {
  [TOK_EOF]: 0,
  [TOK_UNQUOTEDIDENTIFIER2]: 0,
  [TOK_QUOTEDIDENTIFIER2]: 0,
  [TOK_RBRACKET2]: 0,
  [TOK_RPAREN2]: 0,
  [TOK_COMMA2]: 0,
  [TOK_RBRACE2]: 0,
  [TOK_NUMBER2]: 0,
  [TOK_CURRENT3]: 0,
  [TOK_GLOBAL3]: 0,
  [TOK_FIELD]: 0,
  [TOK_EXPREF4]: 0,
  [TOK_PIPE3]: 1,
  [TOK_OR2]: 2,
  [TOK_AND2]: 3,
  [TOK_CONCATENATE2]: 5,
  [TOK_ADD2]: 6,
  [TOK_SUBTRACT2]: 6,
  [TOK_MULTIPLY2]: 7,
  [TOK_DIVIDE2]: 7,
  [TOK_POWER2]: 7,
  [TOK_UNION2]: 7,
  [TOK_EQ3]: 5,
  [TOK_GT3]: 5,
  [TOK_LT3]: 5,
  [TOK_GTE3]: 5,
  [TOK_LTE3]: 5,
  [TOK_NE3]: 5,
  [TOK_FLATTEN3]: 9,
  [TOK_STAR2]: 20,
  [TOK_FILTER2]: 21,
  [TOK_DOT2]: 40,
  [TOK_NOT2]: 30,
  [TOK_UNARY_MINUS2]: 30,
  [TOK_LBRACE2]: 50,
  [TOK_LBRACKET2]: 55,
  [TOK_LPAREN2]: 60
};

// node_modules/@adobe/json-formula/src/jmespath/openFormulaFunctions.js
var MS_IN_DAY = 24 * 60 * 60 * 1e3;

// node_modules/@adobe/json-formula/src/jmespath/jmespath.js
var {
  TYPE_CLASS: TYPE_CLASS2,
  TYPE_ANY: TYPE_ANY2
} = dataTypes_default;

// node_modules/@aemforms/rule-editor-transformer/src/validators/RuleValidator.js
var DEFAULT_TYPES_REGISTRY = new TypesRegistry();

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
  "fd:completion": "Completion",
  "fd:summary": "Summary",
  "fd:options": "Options",
  "fd:navigationChange": "Navigation",
  "fd:submitSuccess": "Successful Submission",
  "fd:submitError": "Error in Submission"
};
var RULE_AST_KEYS = Object.keys(FD_KEY_TO_EVENT);

// node_modules/@aemforms/rule-editor-transformer/src/index.js
var CustomFunctionParser = __toESM(require_stub_CustomFunctionParser(), 1);

// scripts/src/content-model-to-tree.js
var args = process.argv.slice(2);
function arg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : void 0;
}
var contentModelJson = arg("--content-model");
var contentModelFile = arg("--content-model-file");
var outputPath = arg("--output") || `/tmp/treeJson-${process.pid}.json`;
if (!contentModelJson && !contentModelFile) {
  process.stderr.write(
    "Usage: node content-model-to-tree.bundle.js --content-model '<json>'\n       node content-model-to-tree.bundle.js --content-model-file <path>\n       Optional: --output <path>  (default: /tmp/treeJson-<pid>.json)\n"
  );
  process.exit(1);
}
var contentModel;
try {
  const isFilePath = (s) => typeof s === "string" && (s.startsWith("/") || s.startsWith("./") || s.startsWith("~/"));
  const raw = contentModelJson && !isFilePath(contentModelJson) ? contentModelJson : (0, import_fs.readFileSync)(contentModelFile || contentModelJson, "utf8");
  const parsed = JSON.parse(raw);
  contentModel = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
} catch (err) {
  process.stderr.write(`Error: could not parse content model: ${err.message}
`);
  process.exit(1);
}
var treeJson;
try {
  treeJson = ScopeBuilder.fromContentModel(contentModel);
} catch (err) {
  process.stderr.write(`Error: ${err.message}
`);
  process.exit(1);
}
try {
  (0, import_fs.writeFileSync)(outputPath, JSON.stringify(treeJson, null, 2));
} catch (err) {
  process.stderr.write(`Error: could not write ${outputPath}: ${err.message}
`);
  process.exit(1);
}
process.stdout.write(JSON.stringify({ success: true, treeJson, outputPath }, null, 2) + "\n");
process.exit(0);
