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

// scripts/src/validate-rule.js
var import_fs = require("fs");

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

// node_modules/@aemforms/rule-editor-transformer/src/Toggles.js
var DEFAULT_TOGGLES = {
  // is initialized in binary condition context → true().$value
  FT_FORMS_17090: true,
  // is clicked in binary condition context → true()
  FT_FORMS_21266: true,
  // REMOVE_INSTANCE index strategy: false → length(name) - 1, true → getRelativeInstanceIndex
  FT_FORMS_16466: true,
  // Use awaitFn(retryHandler(requestWithRetry(...))) instead of request(...)
  // for WSDL api-integration
  FT_FORMS_19810: true,
  FT_FORMS_11584: true,
  // Allow EVENT_AND_COMPARISON_LEFT_HAND_EXPRESSION as LHS in event conditions
  FT_FORMS_19582: true,
  // FORMAT_EXPRESSION transformation — 'Display Pattern using Custom Function'
  FT_FORMS_13193: true,
  // constraintMessage merge — off by default
  // (legacy-aligned; no regressions to existing test suite)
  FT_FORMS_21359: false,
  // Callback/async function call transformation
  // (enterCALLBACK, enterCONDITION_BLOCK_STATEMENTS, enterASYNC_FUNCTION_CALL)
  FT_FORMS_13519: true,
  // EVENT_SCRIPTS Else block — makes Else BLOCK_STATEMENTS an optional suffix
  // off by default (legacy-aligned; most rule sets use 3-item EVENT_SCRIPTS)
  FT_FORMS_12053: true,
  FT_FORMS_20129: true
};

// node_modules/@aemforms/rule-editor-transformer/src/toggles/StaticToggleProvider.js
var StaticToggleProvider = class {
  constructor(toggles = DEFAULT_TOGGLES) {
    this._toggles = toggles;
  }
  isEnabled(key) {
    return this._toggles[key] ?? false;
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/scope/FunctionsConfig.js
function buildOOTBFunctions(toggleProvider = { isEnabled: () => false }) {
  const functions2 = [
    // Math functions
    {
      id: "abs",
      displayName: "Absolute Value Of",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER",
          name: "value",
          description: "value",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the absolute value of the provided argument $value."
    },
    {
      id: "avg",
      displayName: "Average Of",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER[]",
          name: "elements",
          description: "elements",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the average of the elements in the provided array. An empty array will produce a return value of null."
    },
    {
      id: "ceil",
      displayName: "Ceil",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER",
          name: "value",
          description: "value",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the next highest integer value by rounding up if necessary."
    },
    {
      id: "floor",
      displayName: "Floor",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER",
          name: "value",
          description: "value",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the next lowest integer value by rounding down if necessary."
    },
    {
      id: "exp",
      displayName: "Exponent of",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER",
          name: "input",
          description: "number",
          isMandatory: true
        }
      ],
      impl: "$0()",
      description: "Returns e (the base of natural logarithms) raised to a power x"
    },
    {
      id: "power",
      displayName: "Power of",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER",
          name: "a",
          description: "a",
          isMandatory: true
        },
        {
          type: "NUMBER",
          name: "x",
          description: "x",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Computes `a` raised to a power `x`"
    },
    {
      id: "sqrt",
      displayName: "Square Root Of",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER",
          name: "num",
          description: "number whose square root has to be calculated",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Return the square root of a number"
    },
    {
      id: "mod",
      displayName: "Modulo of",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER",
          name: "dividend",
          description: "dividend",
          isMandatory: true
        },
        {
          type: "NUMBER",
          name: "divisor",
          description: "divisor",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Return the remainder when one number is divided by another number."
    },
    {
      id: "round",
      displayName: "Round",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER",
          name: "num",
          description: "number to round off",
          isMandatory: true
        },
        {
          type: "NUMBER",
          name: "precision",
          description: "number is rounded to the specified precision",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Round a number to a specified precision. If precision is not specified, round to the nearest integer"
    },
    {
      id: "trunc",
      displayName: "Truncate a number",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER",
          name: "numA",
          description: "number to truncate",
          isMandatory: true
        },
        {
          type: "NUMBER",
          name: "numB",
          description: "number of digits to truncate the number to",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Truncate a number to a specified number of digits."
    },
    // String functions
    {
      id: "contains",
      displayName: "Contains",
      type: "BOOLEAN",
      args: [
        {
          type: "STRING[]|NUMBER[]|ARRAY|STRING",
          name: "subject",
          description: "subject",
          isMandatory: true
        },
        {
          type: "STRING|BOOLEAN|NUMBER|DATE",
          name: "search",
          description: "search",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Returns true if the given $subject contains the provided $search string. If $subject is an array, this function returns true if one of the elements in the array is equal to the provided $search value. If the provided $subject is a string, this function returns true if the string contains the provided  $search argument."
    },
    {
      id: "endsWith",
      displayName: "Ends With",
      type: "BOOLEAN",
      args: [
        {
          type: "STRING",
          name: "subject",
          description: "subject",
          isMandatory: true
        },
        {
          type: "STRING",
          name: "prefix",
          description: "prefix",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Returns true if the $subject ends with the $prefix, otherwise this function returns false."
    },
    {
      id: "startsWith",
      displayName: "Starts With",
      type: "BOOLEAN",
      args: [
        {
          type: "STRING",
          name: "subject",
          description: "subject",
          isMandatory: true
        },
        {
          type: "STRING",
          name: "prefix",
          description: "prefix",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Returns true if the $subject starts with the $prefix, otherwise this function returns false."
    },
    {
      id: "lower",
      displayName: "To Lower Case",
      type: "STRING",
      args: [
        {
          type: "STRING",
          name: "input",
          description: "input string",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Converts all the alphabetic characters in a string to lowercase. If the value is not a string it will be converted into string using the default toString method"
    },
    {
      id: "upper",
      displayName: "To Upper Case",
      type: "STRING",
      args: [
        {
          type: "STRING",
          name: "input",
          description: "input string",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Converts all the alphabetic characters in a string to uppercase. If the value is not a string it will be converted into string using the default toString method"
    },
    {
      id: "trim",
      displayName: "Trim",
      type: "STRING",
      args: [
        {
          type: "STRING",
          name: "text",
          description: "string to trim",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Remove leading and trailing spaces, and replace all internal multiple spaces with a single space."
    },
    {
      id: "split",
      displayName: "Split a string into array",
      type: "STRING[]",
      args: [
        {
          type: "STRING",
          name: "string",
          description: "string to split",
          isMandatory: true
        },
        {
          type: "STRING",
          name: "separator",
          description: "separator where the split should occur",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Split a string into an array, given a separator"
    },
    {
      id: "mid",
      displayName: "Substring Of",
      type: "STRING|ARRAY|STRING[]|NUMBER[]|FILE[]|DATE[]|BOOLEAN[]",
      args: [
        {
          type: "STRING|ARRAY",
          name: "subject",
          description: "subject",
          isMandatory: true
        },
        {
          type: "NUMBER",
          name: "startPos",
          description: "startPos",
          isMandatory: true
        },
        {
          type: "NUMBER",
          name: "length",
          description: "length",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2,$3)",
      description: "Returns extracted text, given an original text, starting position, and length. or in case of array, extracts a subset of the array from start till the length number of elements. Returns null"
    },
    {
      id: "proper",
      displayName: "To Uppercase First Letter",
      type: "STRING",
      args: [
        {
          type: "STRING",
          name: "text",
          description: "text",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Return the input string with the first letter of each word converted to an uppercase letter and the rest of the letters in the word converted to lowercase."
    },
    {
      id: "rept",
      displayName: "Repeat String",
      type: "STRING",
      args: [
        {
          type: "STRING",
          name: "text",
          description: "text to repeat",
          isMandatory: true
        },
        {
          type: "NUMBER",
          name: "count",
          description: "number of times to repeat the text",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Return text repeated Count times. rept('x', 5) returns 'xxxxx'"
    },
    {
      id: "replace",
      displayName: "Replace",
      type: "STRING",
      args: [
        {
          type: "STRING",
          name: "text",
          description: "original text",
          isMandatory: true
        },
        {
          type: "NUMBER",
          name: "start",
          description: "index in the original text from where to begin the replacement.",
          isMandatory: true
        },
        {
          type: "NUMBER",
          name: "length",
          description: "number of characters to be replaced",
          isMandatory: true
        },
        {
          type: "STRING",
          name: "replacement",
          description: "string to replace at the start index",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2,$3,$4)",
      description: "Returns text where an old text is substituted at a given start position and length, with a new text."
    },
    {
      id: "_toString",
      displayName: "Convert To String",
      type: "STRING",
      args: [
        {
          type: "STRING|NUMBER|BOOLEAN|DATE|STRING[]|NUMBER[]|ARRAY|OBJECT",
          name: "arg",
          description: "arg",
          isMandatory: true
        }
      ],
      impl: "toString($1)",
      description: "Converts the passed arg to a string string - Returns the passed in value. number/array/object/boolean - The JSON encoded value of the object."
    },
    // Array functions
    {
      id: "sum",
      displayName: "Sum",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER[]",
          name: "collection",
          description: "collection",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the sum of the provided array argument. An empty array will produce a return value of 0."
    },
    {
      id: "min",
      displayName: "Minimum",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER[]|STRING[]",
          name: "collection",
          description: "collection",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the lowest found number in the provided $collection argument."
    },
    {
      id: "max",
      displayName: "Maximum",
      type: "NUMBER",
      args: [
        {
          type: "NUMBER[]|STRING[]",
          name: "collection",
          description: "collection",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the highest found number in the provided array argument. An empty array will produce a return value of null."
    },
    {
      id: "sort",
      displayName: "Sort",
      type: "NUMBER[]|STRING[]",
      args: [
        {
          type: "NUMBER[]|STRING[]",
          name: "list",
          description: "list",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "This function accepts an array $list argument and returns the sorted elements of the $list as an array. The array must be a list of strings or numbers. Sorting strings is based on code points. Locale is not taken into account."
    },
    {
      id: "join",
      displayName: "Join",
      type: "STRING",
      args: [
        {
          type: "STRING",
          name: "glue",
          description: "glue",
          isMandatory: true
        },
        {
          type: "STRING[]",
          name: "stringsarray",
          description: "stringsarray",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Returns all of the elements from the provided $stringsarray array joined together using the $glue argument as a separator between each."
    },
    {
      id: "reverse",
      displayName: "Reverse",
      type: "STRING|STRING[]|NUMBER[]|ARRAY",
      args: [
        {
          type: "STRING|STRING[]|NUMBER[]|ARRAY",
          name: "argument",
          description: "argument",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Reverses the order of the $argument."
    },
    {
      id: "toArray",
      displayName: "Convert To Array",
      type: "STRING[]|NUMBER[]|ARRAY|DATE[]|BOOLEAN[]",
      args: [
        {
          type: "STRING|NUMBER|BOOLEAN|DATE|OBJECT",
          name: "arg",
          description: "arg",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Converts the passed arg to an array array - Returns the passed in value. number/string/object/boolean - Returns a one element array containing the passed in argument."
    },
    {
      id: "unique",
      displayName: "Unique Values Of",
      type: "ARRAY|STRING[]|NUMBER[]|DATE[]|BOOLEAN[]",
      args: [
        {
          type: "ARRAY",
          name: "input",
          description: "input array",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Takes an array and returns unique elements within it"
    },
    {
      id: "length",
      displayName: "Length",
      type: "NUMBER",
      args: [
        {
          type: "STRING|NUMBER|BOOLEAN|DATE|STRING[]|NUMBER[]|DATE[]|BOOLEAN[]|FILE[]|ARRAY|OBJECT|PANEL",
          name: "subject",
          description: "subject",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the length of the given argument using the following types rules: string: returns the number of code points in the string array: returns the number of elements in the array object: returns the number of key-value pairs in the object: returns the number instances in panel"
    },
    // Object functions
    {
      id: "keys",
      displayName: "Keys",
      type: "STRING[]",
      args: [
        {
          type: "OBJECT",
          name: "obj",
          description: "obj",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns an array containing the keys of the provided object. If the passed object is null, the value returned is an empty array"
    },
    {
      id: "values",
      displayName: "Values",
      type: "STRING[]|NUMBER[]|ARRAY",
      args: [
        {
          type: "OBJECT",
          name: "obj",
          description: "obj",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the values of the provided object. Note that because JSON hashes are inheritently unordered, the values associated with the provided object obj are inheritently unordered."
    },
    {
      id: "type",
      displayName: "Type",
      type: "STRING",
      args: [
        {
          type: "STRING|NUMBER|BOOLEAN|DATE|STRING[]|NUMBER[]|ARRAY|OBJECT",
          name: "subject",
          description: "subject",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Returns the JavaScript type of the given $subject argument as a string value. The return value MUST be one of the following: number string boolean array object null"
    },
    // Conversion
    {
      id: "toNumber",
      displayName: "Convert To Number",
      type: "NUMBER",
      args: [
        {
          type: "STRING|NUMBER|BOOLEAN|DATE|STRING[]|NUMBER[]|ARRAY|OBJECT",
          name: "arg",
          description: "arg",
          isMandatory: true
        }
      ],
      impl: "$0($1)",
      description: "Converts the passed arg to a number string - Returns the parsed number. number - Returns the passed in value. array - null object - null boolean - null null - null"
    },
    // Date
    {
      id: "today",
      displayName: "Get Current Date",
      type: "DATE",
      args: [],
      impl: "$0()",
      description: "Returns current date"
    },
    // Form validation
    {
      id: "_validateForm",
      displayName: "Validate Form",
      type: "BOOLEAN",
      args: [],
      impl: "validate($form).length==0",
      description: "Validate Form"
    },
    // Error handling
    {
      id: "defaultErrorHandler",
      displayName: "Default Invoke Service Error Handler",
      type: "ANY",
      args: [
        {
          type: "OBJECT",
          name: "response",
          description: "response",
          isMandatory: true
        },
        {
          type: "OBJECT",
          name: "header",
          description: "header",
          isMandatory: true
        }
      ],
      impl: "$0($1,$2)",
      description: "Default Invoke Service Error Handler",
      isErrorHandler: true
    }
  ];
  if (toggleProvider.isEnabled("FT_FORMS_13209")) {
    functions2.push(
      {
        id: "defaultSubmitSuccessHandler",
        displayName: "Default Submit Form Success Handler",
        type: "ANY",
        args: [],
        impl: "$0()",
        description: "Default Submit Form Success Handler"
      },
      {
        id: "defaultSubmitErrorHandler",
        displayName: "Default Submit Form Error Handler",
        type: "ANY",
        args: [
          {
            type: "STRING",
            name: "defaultSubmitErrorMessage",
            description: "Localized error message",
            isMandatory: true
          }
        ],
        impl: "$0($1)",
        description: "Default Submit Form Error Handler"
      }
    );
  }
  if (toggleProvider.isEnabled("FT_FORMS_13519")) {
    functions2.push({
      id: "getEventPayload",
      displayName: "Get Event Payload",
      type: "STRING|NUMBER|BOOLEAN|DATE|STRING[]|NUMBER[]|DATE[]|BOOLEAN[]|FILE[]|ARRAY|OBJECT",
      args: [
        {
          type: "STRING",
          name: "input",
          description: "input param",
          isMandatory: false
        }
      ],
      impl: "$event.payload.$1",
      description: "Get Event Payload"
    });
  }
  if (toggleProvider.isEnabled("FT_FORMS_19884")) {
    functions2.push(
      {
        id: "setVariable",
        displayName: "Set Variable Value",
        type: "VOID",
        args: [
          {
            type: "STRING",
            name: "variableName",
            description: "Name of the variable (supports dot notation e.g. 'address.city')",
            isMandatory: true
          },
          {
            type: "STRING|NUMBER|BOOLEAN|DATE|AFCOMPONENT|OBJECT|ARRAY",
            name: "variableValue",
            description: "Value to set for the variable",
            isMandatory: true
          },
          {
            type: "AFCOMPONENT|FORM",
            name: "normalFieldOrPanel",
            description: "Field or panel component to set the variable on (defaults to actual Form)",
            isMandatory: false
          }
        ],
        impl: "$0($1,$2,$3)",
        description: "Set variable value on a field or form"
      },
      {
        id: "getVariable",
        displayName: "Get Variable Value",
        type: "STRING|NUMBER|BOOLEAN|DATE|OBJECT|ARRAY|AFCOMPONENT",
        args: [
          {
            type: "STRING",
            name: "variableName",
            description: "Name of the variable (supports dot notation e.g. 'address.city')",
            isMandatory: true
          },
          {
            type: "AFCOMPONENT|FORM",
            name: "normalFieldOrPanel",
            description: "Field or panel component to get the value from (defaults to actual Form)",
            isMandatory: false
          }
        ],
        impl: "$0($1,$2)",
        description: "Get field or form variable value"
      }
    );
  }
  if (toggleProvider.isEnabled("FT_FORMS_20002")) {
    functions2.push(
      {
        id: "exportFormData",
        displayName: "Export Form Data",
        type: "STRING|OBJECT",
        args: [
          {
            type: "BOOLEAN",
            name: "stringify",
            description: "Convert the form data to a JSON string, defaults to true",
            isMandatory: false
          },
          {
            type: "STRING",
            name: "key",
            description: "The key to get the value for (supports dot notation e.g. 'address.city'), defaults to all form data",
            isMandatory: false
          }
        ],
        impl: "$0($1,$2)",
        description: "Export form data as a JSON string"
      },
      {
        id: "importData",
        displayName: "Import Form Data",
        type: "VOID",
        args: [
          {
            type: "OBJECT",
            name: "data",
            description: "The form data to set",
            isMandatory: true
          }
        ],
        impl: "importData($1)",
        description: "Import Form Data"
      }
    );
  }
  if (toggleProvider.isEnabled("FT_FORMS_20129")) {
    functions2.push({
      id: "validate",
      displayName: "Validate",
      type: "BOOLEAN",
      args: [
        {
          type: "AFCOMPONENT|FORM",
          name: "field",
          description: "Field, panel or form component to validate",
          isMandatory: true
        }
      ],
      impl: "$0($1).length==0",
      description: "Validate"
    });
  }
  if (toggleProvider.isEnabled("FT_FORMS_17789")) {
    functions2.push({
      id: "downloadDoR",
      displayName: "Download DoR",
      type: "ANY",
      args: [
        {
          type: "STRING",
          name: "fileName",
          description: "The name of the file to be downloaded. Defaults to 'Downloaded_DoR.pdf' if not specified.",
          isMandatory: false
        }
      ],
      impl: "$0($1)",
      description: "Download DoR"
    });
  }
  return functions2;
}

// node_modules/@aemforms/rule-editor-transformer/src/scope/RBScope.js
var RBScope = class {
  /**
   * Create a scope from form tree JSON and optional custom functions.
   *
   * @param {Object} treeJson - Root node of the form/component tree.
   * @param {Array|Object} [customFunctions=[]] - Custom function list or legacy wrapper
   *   with `customFunction`.
   * @param {Object} [toggleProvider] - ToggleProvider instance with isEnabled(key) method.
   *   Defaults to StaticToggleProvider(DEFAULT_TOGGLES).
   */
  constructor(treeJson, customFunctions = [], toggleProvider = new StaticToggleProvider(DEFAULT_TOGGLES)) {
    if (!treeJson) {
      throw new Error("RBScope requires treeJson");
    }
    const normalizedCustomFunctions = Array.isArray(customFunctions) ? customFunctions : customFunctions?.customFunction || [];
    this.treeJson = treeJson;
    this.customFunctions = normalizedCustomFunctions;
    this.toggleProvider = toggleProvider;
    this.variables = {};
    this.varsByType = {};
    this.components = {};
    this.functions = {};
    this.funcsByType = {};
    this.typeRegistry = new TypesRegistry();
    this._initializeFromTree(treeJson);
    this._registerOOTBFunctions();
    this._registerCustomFunctions(normalizedCustomFunctions);
  }
  /**
   * Populate variable and component registries by traversing the tree.
   *
   * @param {Object} treeJson - Root node of the form/component tree.
   * @returns {void}
   */
  _initializeFromTree(treeJson) {
    this._traverse(treeJson, (node) => {
      this.variables[node.id] = {
        id: node.id,
        name: node.name,
        type: node.type,
        path: node.path
      };
      let typeTokens = [];
      if (node.type) {
        typeTokens = Array.isArray(node.type) ? node.type : [node.type];
      }
      typeTokens.forEach((typeToken) => {
        this.varsByType[typeToken] = this.varsByType[typeToken] || [];
        this.varsByType[typeToken].push(this.variables[node.id]);
      });
      if (node.fieldType) {
        this.components[node.id] = { ...node };
      }
    });
  }
  /**
   * Depth-first traversal over tree nodes.
   *
   * @param {Object} node - Current tree node.
   * @param {Function} callback - Callback executed for each node.
   * @returns {void}
   */
  _traverse(node, callback) {
    callback(node);
    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((child) => {
        this._traverse(child, callback);
      });
    }
  }
  /**
   * Register built-in (OOTB) functions from catalog with toggle-aware filtering.
   *
   * @returns {void}
   */
  _registerOOTBFunctions() {
    const ootbFunctions = buildOOTBFunctions(this.toggleProvider);
    ootbFunctions.forEach((fn) => {
      this.functions[fn.id] = fn;
      (this.funcsByType[fn.type] = this.funcsByType[fn.type] || []).push(fn);
    });
  }
  /**
   * Register user-provided custom functions.
   *
   * @param {Array<Object>} customFunctions - Custom function definitions.
   * @returns {void}
   */
  _registerCustomFunctions(customFunctions) {
    customFunctions.forEach((fn) => {
      this.functions[fn.id] = fn;
      (this.funcsByType[fn.type] = this.funcsByType[fn.type] || []).push(fn);
    });
  }
  /**
   * Get variable metadata by id.
   *
   * @param {string} id - Variable/component id.
   * @returns {Object|undefined}
   */
  getVariable(id) {
    return this.variables[id];
  }
  /**
   * Get function definition by id.
   *
   * @param {string} id - Function id.
   * @returns {Object|undefined}
   */
  getFunction(id) {
    return this.functions[id];
  }
  /**
   * Get component node metadata by id.
   *
   * @param {string} id - Component id.
   * @returns {Object|undefined}
   */
  getComponent(id) {
    return this.components[id];
  }
  /**
   * Check whether a variable exists in scope.
   *
   * @param {string} id - Variable id.
   * @returns {boolean}
   */
  hasVariable(id) {
    return id in this.variables;
  }
  /**
   * Check whether a function exists in scope.
   *
   * @param {string} id - Function id.
   * @returns {boolean}
   */
  hasFunction(id) {
    return id in this.functions;
  }
  /**
   * Resolve allowed member properties for a component type expression.
   *
   * @param {string|string[]} typeValue - Type token(s), optionally pipe-delimited.
   * @returns {string[]}
   */
  getAllowedPropertiesForType(typeValue) {
    return this.typeRegistry.getAllowedPropertiesForType(typeValue);
  }
  /**
   * Check whether a property is allowed for a given type expression.
   *
   * @param {string|string[]} typeValue - Type token(s), optionally pipe-delimited.
   * @param {string} propertyName - Candidate property name.
   * @returns {boolean}
   */
  isPropertyAllowedForType(typeValue, propertyName) {
    return this.typeRegistry.isPropertyAllowed(typeValue, propertyName);
  }
  /**
   * Resolve allowed member properties for a specific component id.
   *
   * @param {string} componentId - Component id.
   * @returns {string[]}
   */
  getAllowedPropertiesForComponent(componentId) {
    const component = this.getComponent(componentId);
    if (!component) {
      return [];
    }
    return this.getAllowedPropertiesForType(component.type);
  }
  /**
   * Check whether a property is allowed for a specific component id.
   *
   * @param {string} componentId - Component id.
   * @param {string} propertyName - Candidate property name.
   * @returns {boolean}
   */
  isPropertyAllowedForComponent(componentId, propertyName) {
    const component = this.getComponent(componentId);
    if (!component) {
      return false;
    }
    return this.isPropertyAllowedForType(component.type, propertyName);
  }
  /**
   * Find all variables whose type array contains any of the requested types.
   *
   * @param {string} types - Pipe-separated type string, e.g. "STRING" or "STRING|NUMBER".
   * @returns {Array<Object>} Matching variable objects, deduplicated.
   */
  findVarByType(types) {
    const tokens = types.split("|").map((t) => t.trim());
    const seen = /* @__PURE__ */ new Set();
    return tokens.flatMap((token) => this.varsByType[token] || []).filter((v) => {
      if (seen.has(v.id)) {
        return false;
      }
      seen.add(v.id);
      return true;
    });
  }
  /**
   * Find all functions whose return type matches any of the requested types.
   *
   * @param {string} types - Pipe-separated type string, e.g. "NUMBER" or "NUMBER|STRING".
   * @returns {Array<Object>} Matching function objects, deduplicated.
   */
  findFunctionsByType(types) {
    const tokens = types.split("|").map((t) => t.trim());
    const seen = /* @__PURE__ */ new Set();
    return tokens.flatMap((token) => this.funcsByType[token] || []).filter((fn) => {
      if (seen.has(fn.id)) {
        return false;
      }
      seen.add(fn.id);
      return true;
    });
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
function getTypeName(inputObj, useValueOf = true) {
  if (inputObj === null) return TYPE_NULL;
  let obj = inputObj;
  if (useValueOf) {
    if (typeof inputObj.valueOf === "function") obj = inputObj.valueOf.call(inputObj);
    else return TYPE_OBJECT;
  }
  switch (Object.prototype.toString.call(obj)) {
    case "[object String]":
      return TYPE_STRING;
    case "[object Number]":
      return TYPE_NUMBER;
    case "[object Array]":
      return TYPE_ARRAY;
    case "[object Boolean]":
      return TYPE_BOOLEAN;
    case "[object Null]":
      return TYPE_NULL;
    case "[object Object]":
      if (obj.jmespathType === TOK_EXPREF) {
        return TYPE_EXPREF;
      }
      return TYPE_OBJECT;
    default:
      return TYPE_OBJECT;
  }
}
function getTypeNames(inputObj) {
  const type1 = getTypeName(inputObj);
  const type2 = getTypeName(inputObj, false);
  return [type1, type2];
}
function matchType(actuals, expectedList, argValue, context, toNumber, toString2) {
  const actual = actuals[0];
  if (expectedList.findIndex(
    (type) => type === TYPE_ANY || actual === type
  ) !== -1) return argValue;
  let wrongType = false;
  if (actual === TYPE_OBJECT || expectedList.length === 1 && expectedList[0] === TYPE_CLASS) {
    wrongType = true;
  }
  if (actual === TYPE_ARRAY && (expectedList.length === 1 && expectedList[0] === TYPE_OBJECT)) {
    wrongType = true;
  }
  if (expectedList.includes(TYPE_ARRAY_ARRAY)) {
    if (actual === TYPE_ARRAY) {
      argValue.forEach((a) => {
        if (!(a instanceof Array)) wrongType = true;
      });
      if (!wrongType) return argValue;
    }
    wrongType = true;
  }
  if (wrongType) {
    throw new Error(`TypeError: ${context} expected argument to be type ${TYPE_NAME_TABLE[expectedList[0]]} but received type ${TYPE_NAME_TABLE[actual]} instead.`);
  }
  let expected = -1;
  if (actual === TYPE_ARRAY) {
    if (expectedList.includes(TYPE_ARRAY_STRING) && expectedList.includes(TYPE_ARRAY_NUMBER)) {
      if (argValue.length > 0 && typeof argValue[0] === "string") expected = TYPE_ARRAY_STRING;
      else expected = TYPE_ARRAY_NUMBER;
    }
  }
  if (expected === -1 && [TYPE_ARRAY_STRING, TYPE_ARRAY_NUMBER, TYPE_ARRAY].includes(actual)) {
    expected = expectedList.find(
      (e) => [TYPE_ARRAY_STRING, TYPE_ARRAY_NUMBER, TYPE_ARRAY].includes(e)
    );
  }
  if (expected === -1) [expected] = expectedList;
  if (expected === TYPE_ANY) return argValue;
  if (expected === TYPE_ARRAY_STRING || expected === TYPE_ARRAY_NUMBER || expected === TYPE_ARRAY) {
    if (expected === TYPE_ARRAY) {
      if (actual === TYPE_ARRAY_NUMBER || actual === TYPE_ARRAY_STRING) return argValue;
      return argValue === null ? [] : [argValue];
    }
    const subtype = expected === TYPE_ARRAY_NUMBER ? TYPE_NUMBER : TYPE_STRING;
    if (actual === TYPE_ARRAY) {
      const returnArray = argValue.slice();
      for (let i = 0; i < returnArray.length; i += 1) {
        const indexType = getTypeNames(returnArray[i]);
        returnArray[i] = matchType(
          indexType,
          [subtype],
          returnArray[i],
          context,
          toNumber,
          toString2
        );
      }
      return returnArray;
    }
    if ([TYPE_NUMBER, TYPE_STRING, TYPE_NULL, TYPE_BOOLEAN].includes(subtype)) {
      return [matchType(actuals, [subtype], argValue, context, toNumber, toString2)];
    }
  } else {
    if (expected === TYPE_NUMBER) {
      if ([TYPE_STRING, TYPE_BOOLEAN, TYPE_NULL].includes(actual)) return toNumber(argValue);
      return 0;
    }
    if (expected === TYPE_STRING) {
      if (actual === TYPE_NULL || actual === TYPE_OBJECT) return "";
      return toString2(argValue);
    }
    if (expected === TYPE_BOOLEAN) {
      return !!argValue;
    }
    if (expected === TYPE_OBJECT && actuals[1] === TYPE_OBJECT) {
      return argValue;
    }
  }
  throw new Error(`TypeError: ${context} expected argument to be type ${TYPE_NAME_TABLE[expectedList[0]]} but received type ${TYPE_NAME_TABLE[actual]} instead.`);
}

// node_modules/@adobe/json-formula/src/jmespath/utils.js
function isArray(obj) {
  return Array.isArray(obj);
}
function isObject(obj) {
  if (obj !== null) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }
  return false;
}
function getValueOf(a) {
  if (a === null || a === void 0) return a;
  if (isArray(a)) {
    return a.map((i) => getValueOf(i));
  }
  if (typeof a.valueOf !== "function") return a;
  return a.valueOf();
}
function strictDeepEqual(lhs, rhs) {
  const first = getValueOf(lhs);
  const second = getValueOf(rhs);
  if (first === second) {
    return true;
  }
  const firstType = Object.prototype.toString.call(first);
  if (firstType !== Object.prototype.toString.call(second)) {
    return false;
  }
  if (isArray(first) === true) {
    if (first.length !== second.length) {
      return false;
    }
    for (let i = 0; i < first.length; i += 1) {
      if (strictDeepEqual(first[i], second[i]) === false) {
        return false;
      }
    }
    return true;
  }
  if (isObject(first) === true) {
    const keysSeen = {};
    for (const key in first) {
      if (hasOwnProperty.call(first, key)) {
        if (strictDeepEqual(first[key], second[key]) === false) {
          return false;
        }
        keysSeen[key] = true;
      }
    }
    for (const key2 in second) {
      if (hasOwnProperty.call(second, key2)) {
        if (keysSeen[key2] !== true) {
          return false;
        }
      }
    }
    return true;
  }
  return false;
}
function getProperty(obj, key) {
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  if (desc?.enumerable || !!desc?.get) {
    obj[key]?.[Symbol.for("track")]?.(obj, key);
    return obj[key];
  }
  return void 0;
}
function debugAvailable(debug, obj, key) {
  try {
    debug.push(`Failed to find: '${key}'`);
    let available = [];
    if (isArray(obj)) {
      available.push(`${0}..${obj.length - 1}`);
    }
    available = [...available, ...Object.entries(Object.getOwnPropertyDescriptors(obj, key)).filter(([k, desc]) => (desc?.enumerable || !!desc?.get) && !/^[0-9]+$/.test(k) && (!k.startsWith("$") || key.startsWith("$"))).map(([k]) => `'${k}'`)];
    if (available.length) debug.push(`Available fields: ${available}`);
  } catch (e) {
  }
}

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
function isFalse(value) {
  if (value === null) return true;
  const obj = getValueOf(value);
  if (obj === "" || obj === false || obj === null) {
    return true;
  }
  if (isArray(obj) && obj.length === 0) {
    return true;
  }
  if (isObject(obj)) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  }
  return !obj;
}
function objValues(obj) {
  return Object.values(obj);
}
var TreeInterpreter = class {
  constructor(runtime, globals, toNumber, toString2, debug, language) {
    this.runtime = runtime;
    this.globals = globals;
    this.toNumber = toNumber;
    this.toString = toString2;
    this.debug = debug;
    this.language = language;
  }
  search(node, value) {
    return this.visit(node, value);
  }
  visit(n, v) {
    const visitFunctions = {
      Field: (node, value) => {
        if (value !== null && (isObject(value) || isArray(value))) {
          const field = getProperty(value, node.name);
          if (field === void 0) {
            debugAvailable(this.debug, value, node.name);
            return null;
          }
          return field;
        }
        return null;
      },
      Subexpression: (node, value) => {
        let result = this.visit(node.children[0], value);
        for (let i = 1; i < node.children.length; i += 1) {
          result = this.visit(node.children[1], result);
          if (result === null) return null;
        }
        return result;
      },
      IndexExpression: (node, value) => {
        const left = this.visit(node.children[0], value);
        return this.visit(node.children[1], left);
      },
      Index: (node, value) => {
        if (isArray(value)) {
          let index = this.toNumber(this.visit(node.value, value));
          if (index < 0) {
            index = value.length + index;
          }
          const result = value[index];
          if (result === void 0) {
            this.debug.push(`Index ${index} out of range`);
            return null;
          }
          return result;
        }
        if (isObject(value)) {
          const key = this.toString(this.visit(node.value, value));
          const result = value[key];
          if (result === void 0) {
            this.debug.push(`Key ${key} does not exist`);
            return null;
          }
          return result;
        }
        this.debug.push(`left side of index expression ${value} is not an array or object.`);
        return null;
      },
      Slice: (node, value) => {
        if (!isArray(value)) return null;
        const sliceParams = node.children.slice(0).map(
          (param) => param != null ? this.toNumber(this.visit(param, value)) : null
        );
        const computed = this.computeSliceParams(value.length, sliceParams);
        const [start, stop, step] = computed;
        const result = [];
        if (step > 0) {
          for (let i = start; i < stop; i += step) {
            result.push(value[i]);
          }
        } else {
          for (let i = start; i > stop; i += step) {
            result.push(value[i]);
          }
        }
        return result;
      },
      Projection: (node, value) => {
        const base = this.visit(node.children[0], value);
        if (!isArray(base)) return null;
        const collected = [];
        base.forEach((b) => {
          const current = this.visit(node.children[1], b);
          if (current !== null) {
            collected.push(current);
          }
        });
        return collected;
      },
      ValueProjection: (node, value) => {
        const projection = this.visit(node.children[0], value);
        if (!isObject(getValueOf(projection))) return null;
        const collected = [];
        const values = objValues(projection);
        values.forEach((val) => {
          const current = this.visit(node.children[1], val);
          if (current !== null) collected.push(current);
        });
        return collected;
      },
      FilterProjection: (node, value) => {
        const base = this.visit(node.children[0], value);
        if (!isArray(base)) return null;
        const filtered = base.filter((b) => {
          const matched = this.visit(node.children[2], b);
          return !isFalse(matched);
        });
        const finalResults = [];
        filtered.forEach((f) => {
          const current = this.visit(node.children[1], f);
          if (current !== null) finalResults.push(current);
        });
        return finalResults;
      },
      Comparator: (node, value) => {
        const first = this.visit(node.children[0], value);
        const second = this.visit(node.children[1], value);
        if (node.name === TOK_EQ) return strictDeepEqual(first, second);
        if (node.name === TOK_NE) return !strictDeepEqual(first, second);
        if (node.name === TOK_GT) return first > second;
        if (node.name === TOK_GTE) return first >= second;
        if (node.name === TOK_LT) return first < second;
        if (node.name === TOK_LTE) return first <= second;
        throw new Error(`Unknown comparator: ${node.name}`);
      },
      [TOK_FLATTEN]: (node, value) => {
        const original = this.visit(node.children[0], value);
        if (!isArray(original)) return null;
        const merged = [];
        original.forEach((current) => {
          if (isArray(current)) {
            merged.push(...current);
          } else {
            merged.push(current);
          }
        });
        return merged;
      },
      Identity: (_node, value) => value,
      MultiSelectList: (node, value) => node.children.map((child) => this.visit(child, value)),
      MultiSelectHash: (node, value) => {
        const collected = {};
        node.children.forEach((child) => {
          collected[child.name] = this.visit(child.value, value);
        });
        return collected;
      },
      OrExpression: (node, value) => {
        let matched = this.visit(node.children[0], value);
        if (isFalse(matched)) matched = this.visit(node.children[1], value);
        return matched;
      },
      AndExpression: (node, value) => {
        const first = this.visit(node.children[0], value);
        if (isFalse(first) === true) return first;
        return this.visit(node.children[1], value);
      },
      AddExpression: (node, value) => {
        const first = this.visit(node.children[0], value);
        const second = this.visit(node.children[1], value);
        return this.applyOperator(first, second, "+");
      },
      ConcatenateExpression: (node, value) => {
        let first = this.visit(node.children[0], value);
        let second = this.visit(node.children[1], value);
        first = matchType(getTypeNames(first), [TYPE_STRING2, TYPE_ARRAY_STRING2], first, "concatenate", this.toNumber, this.toString);
        second = matchType(getTypeNames(second), [TYPE_STRING2, TYPE_ARRAY_STRING2], second, "concatenate", this.toNumber, this.toString);
        return this.applyOperator(first, second, "&");
      },
      UnionExpression: (node, value) => {
        let first = this.visit(node.children[0], value);
        let second = this.visit(node.children[1], value);
        first = matchType(getTypeNames(first), [TYPE_ARRAY2], first, "union", this.toNumber, this.toString);
        second = matchType(getTypeNames(second), [TYPE_ARRAY2], second, "union", this.toNumber, this.toString);
        return first.concat(second);
      },
      SubtractExpression: (node, value) => {
        const first = this.visit(node.children[0], value);
        const second = this.visit(node.children[1], value);
        return this.applyOperator(first, second, "-");
      },
      MultiplyExpression: (node, value) => {
        const first = this.visit(node.children[0], value);
        const second = this.visit(node.children[1], value);
        return this.applyOperator(first, second, "*");
      },
      DivideExpression: (node, value) => {
        const first = this.visit(node.children[0], value);
        const second = this.visit(node.children[1], value);
        return this.applyOperator(first, second, "/");
      },
      PowerExpression: (node, value) => {
        const first = this.visit(node.children[0], value);
        const second = this.visit(node.children[1], value);
        return this.applyOperator(first, second, "^");
      },
      NotExpression: (node, value) => {
        const first = this.visit(node.children[0], value);
        return isFalse(first);
      },
      UnaryMinusExpression: (node, value) => {
        const first = this.visit(node.children[0], value);
        return first * -1;
      },
      Literal: (node) => node.value,
      Number: (node) => node.value,
      [TOK_PIPE]: (node, value) => {
        const left = this.visit(node.children[0], value);
        return this.visit(node.children[1], left);
      },
      [TOK_CURRENT]: (_node, value) => value,
      [TOK_GLOBAL]: (node) => {
        const result = this.globals[node.name];
        return result === void 0 ? null : result;
      },
      Function: (node, value) => {
        if (node.name === "if") return this.runtime.callFunction(node.name, node.children, value, this, false);
        const resolvedArgs = node.children.map((child) => this.visit(child, value));
        return this.runtime.callFunction(node.name, resolvedArgs, value, this);
      },
      ExpressionReference: (node) => {
        const [refNode] = node.children;
        refNode.jmespathType = TOK_EXPREF2;
        return refNode;
      }
    };
    const fn = n && visitFunctions[n.type];
    if (!fn) throw new Error(`Unknown/missing node type ${n && n.type || ""}`);
    return fn(n, v);
  }
  // eslint-disable-next-line class-methods-use-this
  computeSliceParams(arrayLength, sliceParams) {
    function capSliceRange(arrayLen, actual, stp) {
      let actualValue = actual;
      if (actualValue < 0) {
        actualValue += arrayLen;
        if (actualValue < 0) {
          actualValue = stp < 0 ? -1 : 0;
        }
      } else if (actualValue >= arrayLen) {
        actualValue = stp < 0 ? arrayLen - 1 : arrayLen;
      }
      return actualValue;
    }
    let [start, stop, step] = sliceParams;
    if (step === null) {
      step = 1;
    } else if (step === 0) {
      const error = new Error("Invalid slice, step cannot be 0");
      error.name = "RuntimeError";
      throw error;
    }
    const stepValueNegative = step < 0;
    if (start === null) {
      start = stepValueNegative ? arrayLength - 1 : 0;
    } else {
      start = capSliceRange(arrayLength, start, step);
    }
    if (stop === null) {
      stop = stepValueNegative ? -1 : arrayLength;
    } else {
      stop = capSliceRange(arrayLength, stop, step);
    }
    return [start, stop, step];
  }
  applyOperator(first, second, operator) {
    if (isArray(first) && isArray(second)) {
      const shorter = first.length < second.length ? first : second;
      const diff = Math.abs(first.length - second.length);
      shorter.length += diff;
      shorter.fill(null, shorter.length - diff);
      const result = [];
      for (let i = 0; i < first.length; i += 1) {
        result.push(this.applyOperator(first[i], second[i], operator));
      }
      return result;
    }
    if (isArray(first)) return first.map((a) => this.applyOperator(a, second, operator));
    if (isArray(second)) return second.map((a) => this.applyOperator(first, a, operator));
    if (operator === "*") return this.toNumber(first) * this.toNumber(second);
    if (operator === "&") return first + second;
    if (operator === "+") {
      return this.toNumber(first) + this.toNumber(second);
    }
    if (operator === "-") return this.toNumber(first) - this.toNumber(second);
    if (operator === "/") {
      const result = first / second;
      return Number.isFinite(result) ? result : null;
    }
    if (operator === "^") {
      return first ** second;
    }
    throw new Error(`Unknown operator: ${operator}`);
  }
};

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
var basicTokens = {
  ".": TOK_DOT,
  // "*": TOK_STAR,
  ",": TOK_COMMA,
  ":": TOK_COLON,
  "{": TOK_LBRACE,
  "}": TOK_RBRACE,
  "]": TOK_RBRACKET,
  "(": TOK_LPAREN,
  ")": TOK_RPAREN,
  "@": TOK_CURRENT2
};
var globalStartToken = "$";
var operatorStartToken = {
  "<": true,
  ">": true,
  "=": true,
  "!": true
};
var skipChars = {
  " ": true,
  "	": true,
  "\n": true
};
function isNum(ch) {
  return ch >= "0" && ch <= "9" || ch === ".";
}
function isAlphaNum(ch) {
  return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch >= "0" && ch <= "9" || ch === "_";
}
function isIdentifier(stream, pos) {
  const ch = stream[pos];
  if (ch === "$") {
    return stream.length > pos && isAlphaNum(stream[pos + 1]);
  }
  return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "_";
}
var Lexer = class {
  constructor(allowedGlobalNames = [], debug = []) {
    this._allowedGlobalNames = allowedGlobalNames;
    this.debug = debug;
  }
  tokenize(stream) {
    const tokens = [];
    this._current = 0;
    let start;
    let identifier;
    let token;
    while (this._current < stream.length) {
      const prev = tokens.length ? tokens.slice(-1)[0].type : null;
      if (this._isGlobal(prev, stream, this._current)) {
        tokens.push(this._consumeGlobal(stream));
      } else if (isIdentifier(stream, this._current)) {
        start = this._current;
        identifier = this._consumeUnquotedIdentifier(stream);
        tokens.push({
          type: TOK_UNQUOTEDIDENTIFIER,
          value: identifier,
          start
        });
      } else if (basicTokens[stream[this._current]] !== void 0) {
        tokens.push({
          type: basicTokens[stream[this._current]],
          value: stream[this._current],
          start: this._current
        });
        this._current += 1;
      } else if (stream[this._current] === "-" && ![TOK_GLOBAL2, TOK_CURRENT2, TOK_NUMBER, TOK_RPAREN, TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER, TOK_RBRACKET].includes(prev)) {
        token = this._consumeUnaryMinus(stream);
        tokens.push(token);
      } else if (isNum(stream[this._current])) {
        token = this._consumeNumber(stream);
        tokens.push(token);
      } else if (stream[this._current] === "[") {
        token = this._consumeLBracket(stream);
        tokens.push(token);
      } else if (stream[this._current] === '"') {
        start = this._current;
        identifier = this._consumeQuotedIdentifier(stream);
        tokens.push({
          type: TOK_QUOTEDIDENTIFIER,
          value: identifier,
          start
        });
      } else if (stream[this._current] === "'") {
        start = this._current;
        identifier = this._consumeRawStringLiteral(stream);
        tokens.push({
          type: TOK_LITERAL,
          value: identifier,
          start
        });
      } else if (stream[this._current] === "`") {
        start = this._current;
        const literal = this._consumeLiteral(stream);
        tokens.push({
          type: TOK_LITERAL,
          value: literal,
          start
        });
      } else if (operatorStartToken[stream[this._current]] !== void 0) {
        tokens.push(this._consumeOperator(stream));
      } else if (skipChars[stream[this._current]] !== void 0) {
        this._current += 1;
      } else if (stream[this._current] === "&") {
        start = this._current;
        this._current += 1;
        if (stream[this._current] === "&") {
          this._current += 1;
          tokens.push({ type: TOK_AND, value: "&&", start });
        } else if (prev === TOK_COMMA || prev === TOK_LPAREN) {
          tokens.push({ type: TOK_EXPREF3, value: "&", start });
        } else {
          tokens.push({ type: TOK_CONCATENATE, value: "&", start });
        }
      } else if (stream[this._current] === "~") {
        start = this._current;
        this._current += 1;
        tokens.push({ type: TOK_UNION, value: "~", start });
      } else if (stream[this._current] === "+") {
        start = this._current;
        this._current += 1;
        tokens.push({ type: TOK_ADD, value: "+", start });
      } else if (stream[this._current] === "-") {
        start = this._current;
        this._current += 1;
        tokens.push({ type: TOK_SUBTRACT, value: "-", start });
      } else if (stream[this._current] === "*") {
        start = this._current;
        this._current += 1;
        const prevToken = tokens.length && tokens.slice(-1)[0].type;
        if (tokens.length === 0 || [
          TOK_LBRACKET,
          TOK_DOT,
          TOK_PIPE2,
          TOK_AND,
          TOK_OR,
          TOK_COMMA,
          TOK_COLON
        ].includes(prevToken)) {
          tokens.push({ type: TOK_STAR, value: "*", start });
        } else {
          tokens.push({ type: TOK_MULTIPLY, value: "*", start });
        }
      } else if (stream[this._current] === "/") {
        start = this._current;
        this._current += 1;
        tokens.push({ type: TOK_DIVIDE, value: "/", start });
      } else if (stream[this._current] === "^") {
        start = this._current;
        this._current += 1;
        tokens.push({ type: TOK_POWER, value: "^", start });
      } else if (stream[this._current] === "|") {
        start = this._current;
        this._current += 1;
        if (stream[this._current] === "|") {
          this._current += 1;
          tokens.push({ type: TOK_OR, value: "||", start });
        } else {
          tokens.push({ type: TOK_PIPE2, value: "|", start });
        }
      } else {
        const error = new Error(`Unknown character:${stream[this._current]}`);
        error.name = "LexerError";
        throw error;
      }
    }
    return tokens;
  }
  _consumeUnquotedIdentifier(stream) {
    const start = this._current;
    this._current += 1;
    while (this._current < stream.length && isAlphaNum(stream[this._current])) {
      this._current += 1;
    }
    return stream.slice(start, this._current);
  }
  _consumeQuotedIdentifier(stream) {
    const start = this._current;
    this._current += 1;
    const maxLength = stream.length;
    let foundNonAlpha = !isIdentifier(stream, start + 1);
    while (stream[this._current] !== '"' && this._current < maxLength) {
      let current = this._current;
      if (!isAlphaNum(stream[current])) foundNonAlpha = true;
      if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === '"')) {
        current += 2;
      } else {
        current += 1;
      }
      this._current = current;
    }
    this._current += 1;
    const val = stream.slice(start, this._current);
    try {
      if (!foundNonAlpha || val.includes(" ")) {
        this.debug.push(`Suspicious quotes: ${val}`);
        this.debug.push(`Did you intend a literal? '${val.replace(/"/g, "")}'?`);
      }
    } catch (e) {
    }
    return JSON.parse(val);
  }
  _consumeRawStringLiteral(stream) {
    const start = this._current;
    this._current += 1;
    const maxLength = stream.length;
    while (stream[this._current] !== "'" && this._current < maxLength) {
      let current = this._current;
      if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "'")) {
        current += 2;
      } else {
        current += 1;
      }
      this._current = current;
    }
    this._current += 1;
    const literal = stream.slice(start + 1, this._current - 1);
    return literal.replaceAll("\\'", "'");
  }
  _consumeNumber(stream) {
    const start = this._current;
    this._current += 1;
    const maxLength = stream.length;
    while (isNum(stream[this._current]) && this._current < maxLength) {
      this._current += 1;
    }
    const n = stream.slice(start, this._current);
    let value;
    if (n.includes(".")) {
      value = parseFloat(n);
    } else {
      value = parseInt(n, 10);
    }
    return { type: TOK_NUMBER, value, start };
  }
  _consumeUnaryMinus() {
    const start = this._current;
    this._current += 1;
    return { type: TOK_UNARY_MINUS, value: "-", start };
  }
  _consumeLBracket(stream) {
    const start = this._current;
    this._current += 1;
    if (stream[this._current] === "?") {
      this._current += 1;
      return { type: TOK_FILTER, value: "[?", start };
    }
    if (stream[this._current] === "]") {
      this._current += 1;
      return { type: TOK_FLATTEN2, value: "[]", start };
    }
    return { type: TOK_LBRACKET, value: "[", start };
  }
  _isGlobal(prev, stream, pos) {
    if (prev !== null && prev === TOK_DOT) return false;
    const ch = stream[pos];
    if (ch !== globalStartToken) return false;
    let i = pos + 1;
    while (i < stream.length && isAlphaNum(stream[i])) i += 1;
    const global = stream.slice(pos, i);
    return this._allowedGlobalNames.includes(global);
  }
  _consumeGlobal(stream) {
    const start = this._current;
    this._current += 1;
    while (this._current < stream.length && isAlphaNum(stream[this._current])) this._current += 1;
    const global = stream.slice(start, this._current);
    return { type: TOK_GLOBAL2, name: global, start };
  }
  _consumeOperator(stream) {
    const start = this._current;
    const startingChar = stream[start];
    this._current += 1;
    if (startingChar === "!") {
      if (stream[this._current] === "=") {
        this._current += 1;
        return { type: TOK_NE2, value: "!=", start };
      }
      return { type: TOK_NOT, value: "!", start };
    }
    if (startingChar === "<") {
      if (stream[this._current] === "=") {
        this._current += 1;
        return { type: TOK_LTE2, value: "<=", start };
      }
      if (stream[this._current] === ">") {
        this._current += 1;
        return { type: TOK_NE2, value: "<>", start };
      }
      return { type: TOK_LT2, value: "<", start };
    }
    if (startingChar === ">") {
      if (stream[this._current] === "=") {
        this._current += 1;
        return { type: TOK_GTE2, value: ">=", start };
      }
      return { type: TOK_GT2, value: ">", start };
    }
    if (stream[this._current] === "=") {
      this._current += 1;
      return { type: TOK_EQ2, value: "==", start };
    }
    return { type: TOK_EQ2, value: "=", start };
  }
  _consumeLiteral(stream) {
    function _looksLikeJSON(str) {
      if (str === "") return false;
      if ('[{"'.includes(str[0])) return true;
      if (["true", "false", "null"].includes(str)) return true;
      if ("-0123456789".includes(str[0])) {
        try {
          JSON.parse(str);
          return true;
        } catch (ex) {
          return false;
        }
      } else {
        return false;
      }
    }
    this._current += 1;
    const start = this._current;
    const maxLength = stream.length;
    let literal;
    let inQuotes = false;
    while ((inQuotes || stream[this._current] !== "`") && this._current < maxLength) {
      let current = this._current;
      if (inQuotes && stream[current] === "\\" && stream[current + 1] === '"') current += 2;
      else {
        if (stream[current] === '"') inQuotes = !inQuotes;
        if (inQuotes && stream[current + 1] === "`") current += 2;
        else if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "`")) {
          current += 2;
        } else {
          current += 1;
        }
      }
      this._current = current;
    }
    let literalString = stream.slice(start, this._current).trimStart();
    literalString = literalString.replaceAll("\\`", "`");
    if (_looksLikeJSON(literalString)) {
      literal = JSON.parse(literalString);
    } else {
      literal = JSON.parse(`"${literalString}"`);
    }
    this._current += 1;
    return literal;
  }
};

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
var Parser = class {
  constructor(allowedGlobalNames = []) {
    this._allowedGlobalNames = allowedGlobalNames;
  }
  parse(expression, debug) {
    this._loadTokens(expression, debug);
    this.index = 0;
    const ast = this.expression(0);
    if (this._lookahead(0) !== TOK_EOF) {
      const t = this._lookaheadToken(0);
      const error = new Error(
        `Unexpected token type: ${t.type}, value: ${t.value}`
      );
      error.name = "ParserError";
      throw error;
    }
    return ast;
  }
  _loadTokens(expression, debug) {
    const lexer = new Lexer(this._allowedGlobalNames, debug);
    const tokens = lexer.tokenize(expression);
    tokens.push({ type: TOK_EOF, value: "", start: expression.length });
    this.tokens = tokens;
  }
  expression(rbp) {
    const leftToken = this._lookaheadToken(0);
    this._advance();
    let left = this.nud(leftToken);
    let currentToken = this._lookahead(0);
    while (rbp < bindingPower[currentToken]) {
      this._advance();
      left = this.led(currentToken, left);
      currentToken = this._lookahead(0);
    }
    return left;
  }
  _lookahead(number) {
    return this.tokens[this.index + number].type;
  }
  _lookaheadToken(number) {
    return this.tokens[this.index + number];
  }
  _advance() {
    this.index += 1;
  }
  _getIndex() {
    return this.index;
  }
  _setIndex(index) {
    this.index = index;
  }
  // eslint-disable-next-line consistent-return
  nud(token) {
    let left;
    let right;
    let expression;
    let node;
    let args;
    switch (token.type) {
      case TOK_LITERAL2:
        return { type: "Literal", value: token.value };
      case TOK_NUMBER2:
        return { type: "Number", value: token.value };
      case TOK_UNQUOTEDIDENTIFIER2:
        return { type: "Field", name: token.value };
      case TOK_QUOTEDIDENTIFIER2:
        node = { type: "Field", name: token.value };
        if (this._lookahead(0) === TOK_LPAREN2) {
          throw new Error("Quoted identifier not allowed for function names.");
        }
        return node;
      case TOK_NOT2:
        right = this.expression(bindingPower.Not);
        return { type: "NotExpression", children: [right] };
      case TOK_UNARY_MINUS2:
        right = this.expression(bindingPower.UnaryMinus);
        return { type: "UnaryMinusExpression", children: [right] };
      case TOK_STAR2:
        left = { type: "Identity" };
        if (this._lookahead(0) === TOK_RBRACKET2) {
          right = { type: "Identity" };
        } else {
          right = this._parseProjectionRHS(bindingPower.Star);
        }
        return { type: "ValueProjection", children: [left, right] };
      case TOK_FILTER2:
        return this.led(token.type, { type: "Identity" });
      case TOK_LBRACE2:
        return this._parseMultiselectHash();
      case TOK_FLATTEN3:
        left = { type: TOK_FLATTEN3, children: [{ type: "Identity" }] };
        right = this._parseProjectionRHS(bindingPower.Flatten);
        return { type: "Projection", children: [left, right] };
      case TOK_LBRACKET2:
        if (this._lookahead(0) === TOK_STAR2 && this._lookahead(1) === TOK_RBRACKET2) {
          this._advance();
          this._advance();
          right = this._parseProjectionRHS(bindingPower.Star);
          return {
            type: "Projection",
            children: [{ type: "Identity" }, right]
          };
        }
        return this._parseUnchainedIndexExpression();
      case TOK_CURRENT3:
        return { type: TOK_CURRENT3 };
      case TOK_GLOBAL3:
        return { type: TOK_GLOBAL3, name: token.name };
      case TOK_FIELD:
        return { type: TOK_FIELD };
      case TOK_EXPREF4:
        expression = this.expression(bindingPower.Expref);
        return { type: "ExpressionReference", children: [expression] };
      case TOK_LPAREN2:
        args = [];
        while (this._lookahead(0) !== TOK_RPAREN2) {
          expression = this.expression(0);
          args.push(expression);
        }
        this._match(TOK_RPAREN2);
        return args[0];
      default:
        this._errorToken(token);
    }
  }
  // eslint-disable-next-line consistent-return
  led(tokenName, left) {
    let condition;
    let right;
    let name;
    let args;
    let expression;
    let node;
    let rbp;
    let leftNode;
    let rightNode;
    switch (tokenName) {
      case TOK_CONCATENATE2:
        right = this.expression(bindingPower.Concatenate);
        return { type: "ConcatenateExpression", children: [left, right] };
      case TOK_DOT2:
        rbp = bindingPower.Dot;
        if (this._lookahead(0) !== TOK_STAR2) {
          right = this._parseDotRHS(rbp);
          return { type: "Subexpression", children: [left, right] };
        }
        this._advance();
        right = this._parseProjectionRHS(rbp);
        return { type: "ValueProjection", children: [left, right] };
      case TOK_PIPE3:
        right = this.expression(bindingPower.Pipe);
        return { type: TOK_PIPE3, children: [left, right] };
      case TOK_OR2:
        right = this.expression(bindingPower.Or);
        return { type: "OrExpression", children: [left, right] };
      case TOK_AND2:
        right = this.expression(bindingPower.And);
        return { type: "AndExpression", children: [left, right] };
      case TOK_ADD2:
        right = this.expression(bindingPower.Add);
        return { type: "AddExpression", children: [left, right] };
      case TOK_SUBTRACT2:
        right = this.expression(bindingPower.Subtract);
        return { type: "SubtractExpression", children: [left, right] };
      case TOK_MULTIPLY2:
        right = this.expression(bindingPower.Multiply);
        return { type: "MultiplyExpression", children: [left, right] };
      case TOK_DIVIDE2:
        right = this.expression(bindingPower.Divide);
        return { type: "DivideExpression", children: [left, right] };
      case TOK_POWER2:
        right = this.expression(bindingPower.Power);
        return { type: "PowerExpression", children: [left, right] };
      case TOK_UNION2:
        right = this.expression(bindingPower.Power);
        return { type: "UnionExpression", children: [left, right] };
      case TOK_LPAREN2:
        name = left.name;
        args = [];
        while (this._lookahead(0) !== TOK_RPAREN2) {
          expression = this.expression(0);
          if (this._lookahead(0) === TOK_COMMA2) {
            this._match(TOK_COMMA2);
          }
          args.push(expression);
        }
        this._match(TOK_RPAREN2);
        node = { type: "Function", name, children: args };
        return node;
      case TOK_FILTER2:
        condition = this.expression(0);
        this._match(TOK_RBRACKET2);
        if (this._lookahead(0) === TOK_FLATTEN3) {
          right = { type: "Identity" };
        } else {
          right = this._parseProjectionRHS(bindingPower.Filter);
        }
        return { type: "FilterProjection", children: [left, right, condition] };
      case TOK_FLATTEN3:
        leftNode = { type: TOK_FLATTEN3, children: [left] };
        rightNode = this._parseProjectionRHS(bindingPower.Flatten);
        return { type: "Projection", children: [leftNode, rightNode] };
      case TOK_EQ3:
      case TOK_NE3:
      case TOK_GT3:
      case TOK_GTE3:
      case TOK_LT3:
      case TOK_LTE3:
        return this._parseComparator(left, tokenName);
      case TOK_LBRACKET2:
        if (this._lookahead(0) === TOK_STAR2 && this._lookahead(1) === TOK_RBRACKET2) {
          this._advance();
          this._advance();
          right = this._parseProjectionRHS(bindingPower.Star);
          return { type: "Projection", children: [left, right] };
        }
        right = this._parseChainedIndexExpression();
        return this._projectIfSlice(left, right);
      default:
        this._errorToken(this._lookaheadToken(0));
    }
  }
  _match(tokenType) {
    if (this._lookahead(0) === tokenType) {
      this._advance();
    } else {
      const t = this._lookaheadToken(0);
      const error = new Error(`Expected ${tokenType}, got: ${t.type}`);
      error.name = "ParserError";
      throw error;
    }
  }
  // eslint-disable-next-line class-methods-use-this
  _errorToken(token) {
    const error = new Error(`Invalid token (${token.type}): "${token.value}"`);
    error.name = "ParserError";
    throw error;
  }
  _parseChainedIndexExpression() {
    const oldIndex = this._getIndex();
    if (this._lookahead(0) === TOK_COLON2) {
      return this._parseSliceExpression();
    }
    const first = this.expression(0);
    const token = this._lookahead(0);
    if (token === TOK_COLON2) {
      this._setIndex(oldIndex);
      return this._parseSliceExpression();
    }
    this._match(TOK_RBRACKET2);
    return {
      type: "Index",
      value: first
    };
  }
  _parseUnchainedIndexExpression() {
    const oldIndex = this._getIndex();
    const firstToken = this._lookahead(0);
    if (firstToken === TOK_COLON2) {
      const right = this._parseSliceExpression();
      return this._projectIfSlice({ type: "Identity" }, right);
    }
    const first = this.expression(0);
    const currentToken = this._lookahead(0);
    if (currentToken === TOK_COMMA2) {
      this._setIndex(oldIndex);
      return this._parseMultiselectList();
    }
    if (currentToken === TOK_COLON2) {
      this._setIndex(oldIndex);
      const right = this._parseSliceExpression();
      return this._projectIfSlice({ type: "Identity" }, right);
    }
    if (firstToken === TOK_NUMBER2 || firstToken === TOK_UNARY_MINUS2) {
      this._match(TOK_RBRACKET2);
      return {
        type: "Index",
        value: first
      };
    }
    this._setIndex(oldIndex);
    return this._parseMultiselectList();
  }
  _projectIfSlice(left, right) {
    const indexExpr = { type: "IndexExpression", children: [left, right] };
    if (right.type === "Slice") {
      return {
        type: "Projection",
        children: [indexExpr, this._parseProjectionRHS(bindingPower.Star)]
      };
    }
    return indexExpr;
  }
  _parseSliceExpression() {
    const parts = [null, null, null];
    let index = 0;
    let currentToken = this._lookahead(0);
    while (currentToken !== TOK_RBRACKET2 && index < 3) {
      if (currentToken === TOK_COLON2 && index < 2) {
        index += 1;
        this._advance();
      } else {
        parts[index] = this.expression(0);
        const t = this._lookahead(0);
        if (t !== TOK_COLON2 && t !== TOK_RBRACKET2) {
          const error = new Error(`Syntax error, unexpected token: ${t.value}(${t.type})`);
          error.name = "Parsererror";
          throw error;
        }
      }
      currentToken = this._lookahead(0);
    }
    this._match(TOK_RBRACKET2);
    return {
      type: "Slice",
      children: parts
    };
  }
  _parseComparator(left, comparator) {
    const right = this.expression(bindingPower[comparator]);
    return { type: "Comparator", name: comparator, children: [left, right] };
  }
  // eslint-disable-next-line consistent-return
  _parseDotRHS(rbp) {
    const lookahead = this._lookahead(0);
    const exprTokens = [TOK_UNQUOTEDIDENTIFIER2, TOK_QUOTEDIDENTIFIER2, TOK_STAR2];
    if (exprTokens.indexOf(lookahead) >= 0) {
      return this.expression(rbp);
    }
    if (lookahead === TOK_LBRACKET2) {
      this._match(TOK_LBRACKET2);
      return this._parseMultiselectList();
    }
    if (lookahead === TOK_LBRACE2) {
      this._match(TOK_LBRACE2);
      return this._parseMultiselectHash();
    }
  }
  _parseProjectionRHS(rbp) {
    let right;
    if (bindingPower[this._lookahead(0)] < 10) {
      right = { type: "Identity" };
    } else if (this._lookahead(0) === TOK_LBRACKET2) {
      right = this.expression(rbp);
    } else if (this._lookahead(0) === TOK_FILTER2) {
      right = this.expression(rbp);
    } else if (this._lookahead(0) === TOK_DOT2) {
      this._match(TOK_DOT2);
      right = this._parseDotRHS(rbp);
    } else {
      const t = this._lookaheadToken(0);
      const error = new Error(`Sytanx error, unexpected token: ${t.value}(${t.type})`);
      error.name = "ParserError";
      throw error;
    }
    return right;
  }
  _parseMultiselectList() {
    const expressions = [];
    while (this._lookahead(0) !== TOK_RBRACKET2) {
      const expression = this.expression(0);
      expressions.push(expression);
      if (this._lookahead(0) === TOK_COMMA2) {
        this._match(TOK_COMMA2);
        if (this._lookahead(0) === TOK_RBRACKET2) {
          throw new Error("Unexpected token Rbracket");
        }
      }
    }
    this._match(TOK_RBRACKET2);
    return { type: "MultiSelectList", children: expressions };
  }
  _parseMultiselectHash() {
    const pairs = [];
    const identifierTypes = [TOK_UNQUOTEDIDENTIFIER2, TOK_QUOTEDIDENTIFIER2];
    let keyToken;
    let keyName;
    let value;
    let node;
    if (this._lookahead(0) === TOK_RBRACE2) {
      this._advance();
      return { type: "MultiSelectHash", children: [] };
    }
    for (; ; ) {
      keyToken = this._lookaheadToken(0);
      if (identifierTypes.indexOf(keyToken.type) < 0) {
        throw new Error(`Expecting an identifier token, got: ${keyToken.type}`);
      }
      keyName = keyToken.value;
      this._advance();
      this._match(TOK_COLON2);
      value = this.expression(0);
      node = { type: "KeyValuePair", name: keyName, value };
      pairs.push(node);
      if (this._lookahead(0) === TOK_COMMA2) {
        this._match(TOK_COMMA2);
      } else if (this._lookahead(0) === TOK_RBRACE2) {
        this._match(TOK_RBRACE2);
        break;
      }
    }
    return { type: "MultiSelectHash", children: pairs };
  }
};

// node_modules/@adobe/json-formula/src/jmespath/openFormulaFunctions.js
function round(num, digits) {
  const precision = 10 ** digits;
  return Math.round(num * precision) / precision;
}
var MS_IN_DAY = 24 * 60 * 60 * 1e3;
function getDateObj(dateNum) {
  return new Date(Math.round(dateNum * MS_IN_DAY));
}
function getDateNum(dateObj) {
  return dateObj / MS_IN_DAY;
}
function openFormulaFunctions(valueOf, toString2, toNumber, debug = []) {
  return {
    /**
     * Returns the logical AND result of all parameters.
     * If the parameters are not boolean they will be cast to boolean as per the following rules
     * * null -> false
     * * number -> false if the number is 0, true otherwise
     * * string -> false if the string is empty, true otherwise. String "false" resolves to true
     * * array -> true
     * * object -> true
     * @param {any} firstOperand logical expression
     * @param {...any} [additionalOperands] any number of additional expressions
     * @returns {boolean} The logical result of applying AND to all parameters
     * @example
     * and(10 > 8, length('foo') < 5) // returns true
     * @example
     * and(`null`, length('foo') < 5) // returns false
     * @function
     * @category openFormula
     */
    and: {
      _func: (resolvedArgs) => {
        let result = !!valueOf(resolvedArgs[0]);
        resolvedArgs.slice(1).forEach((arg) => {
          result = result && !!valueOf(arg);
        });
        return result;
      },
      _signature: [{ types: [dataTypes_default.TYPE_ANY], variadic: true }]
    },
    /**
     * Returns a lower-case string of the `input` string using locale-specific mappings.
     * e.g. Strings with German lowercase letter 'ß' can be compared to 'ss'
     * @param {string} input string to casefold
     * @returns {string} A new string converted to lower case
     * @function casefold
     * @example
     * casefold('AbC') // returns 'abc'
     * @category JSONFormula
     */
    casefold: {
      _func: (args, _data, interpreter) => {
        const str = toString2(args[0]);
        return str.toLocaleUpperCase(interpreter.language).toLocaleLowerCase(interpreter.language);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    /**
     * Return difference between two date values.
     * @param {number} start_date The starting date.
     * Dates should be entered by using the [datetime]{@link datetime} function
     * @param {number} end_date The end date -- must be greater or equal to start_date.
     * Dates should be entered by using the [datetime]{@link datetime} function
     * @param {string} unit  One of:
     * * `y` the number of whole years between start_date and end_date
     * * `m` the number of whole months between start_date and end_date.
     * * `d` the number of days between start_date and end_date
     * * `md` the number of days between start_date and end_date after subtracting whole months.
     * * `ym` the number of whole months between start_date and end_date
     * after subtracting whole years.
     * * `yd` the number of days between start_date and end_date, assuming start_date
     * and end_date were no more than one year apart
     * @returns {integer} The number of days/months/years difference
     * @function
     * @category openFormula
     * @example
     * datedif(datetime(2001, 1, 1), datetime(2003, 1, 1), 'y') // returns 2
     * @example
     * datedif(datetime(2001, 6, 1), datetime(2003, 8, 15), 'D') // returns 805
     * // 805 days between June 1, 2001, and August 15, 2003
     * @example
     * datedif(datetime(2001, 6, 1), datetime(2003, 8, 15), 'YD') // returns 75
     * // 75 days between June 1 and August 15, ignoring the years of the dates (75)
     */
    datedif: {
      _func: (args) => {
        const unit = toString2(args[2]).toLowerCase();
        const date1 = getDateObj(args[0]);
        const date2 = getDateObj(args[1]);
        if (date2 === date1) return 0;
        if (date2 < date1) return null;
        if (unit === "d") return Math.floor(getDateNum(date2 - date1));
        const yearDiff = date2.getFullYear() - date1.getFullYear();
        let monthDiff = date2.getMonth() - date1.getMonth();
        const dayDiff = date2.getDate() - date1.getDate();
        if (unit === "y") {
          let y = yearDiff;
          if (monthDiff < 0) y -= 1;
          if (monthDiff === 0 && dayDiff < 0) y -= 1;
          return y;
        }
        if (unit === "m") {
          return yearDiff * 12 + monthDiff + (dayDiff < 0 ? -1 : 0);
        }
        if (unit === "ym") {
          if (dayDiff < 0) monthDiff -= 1;
          if (monthDiff <= 0 && yearDiff > 0) return 12 + monthDiff;
          return monthDiff;
        }
        if (unit === "yd") {
          if (dayDiff < 0) monthDiff -= 1;
          if (monthDiff < 0) date2.setFullYear(date1.getFullYear() + 1);
          else date2.setFullYear(date1.getFullYear());
          return Math.floor(getDateNum(date2 - date1));
        }
        throw new TypeError(`Unrecognized unit parameter "${unit}" for datedif()`);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    /**
     * Return a date/time value.
     * @param {integer} year Integer value representing the year.
     * Values from 0 to 99 map to the years 1900 to 1999. All other values are the actual year
     * @param {integer} month Integer value representing the month, beginning with 1 for
     * January to 12 for December.
     * @param {integer} day Integer value representing the day of the month.
     * @param {integer} [hours] Integer value between 0 and 23 representing the hour of the day.
     * Defaults to 0.
     * @param {integer} [minutes] Integer value representing the minute segment of a time.
     * The default is 0 minutes past the hour.
     * @param {integer} [seconds] Integer value representing the second segment of a time.
     * The default is 0 seconds past the minute.
     * @param {integer} [milliseconds] Integer value representing the millisecond segment of a time.
     * The default is 0 milliseconds past the second.
     * @returns {number} A date/time value represented by number of seconds since 1 January 1970.
     * @kind function
     * @function
     * @category JSONFormula
     * @example
     * datetime(2010, 10, 10) // returns representation of October 10, 2010
     * @example
     * datetime(2010, 2, 28) // returns representation of February 28, 2010
     */
    datetime: {
      _func: (args) => {
        const year = args[0];
        const month = args[1] - 1;
        const day = args[2];
        const hours = args.length > 3 ? args[3] : 0;
        const minutes = args.length > 4 ? args[4] : 0;
        const seconds = args.length > 5 ? args[5] : 0;
        const ms = args.length > 6 ? args[6] : 0;
        const baseDate = new Date(year, month, day, hours, minutes, seconds, ms);
        return getDateNum(baseDate);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true }
      ]
    },
    /**
     * Returns the day of a date, represented by a serial number.
     * The day is given as an integer ranging from 1 to 31.
     * @param {number} The date of the day you are trying to find.
     * Dates should be entered by using the [datetime]{@link datetime} function
     * @return {number}
     * @function day
     * @category openFormula
     * @example
     * day(datetime(2008,5,23)) //returns 23
     */
    day: {
      _func: (args) => getDateObj(args[0]).getDate(),
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Searches a nested hierarchy of objects to return an array of elements that match a `name`.
     * The name can be either a key into a map or an array index.
     * This is similar to the JSONPath deep scan operator (..)
     * @param {object} object The starting object or array where we start the search
     * @param {string} name The name (or index position) of the elements to find
     * @returns {any}
     * @function
     * @category JSONFormula
     * @example
     * deepScan({a : {b1 : {c : 2}, b2 : {c : 3}}}, 'c') //returns [2, 3]
     */
    deepScan: {
      _func: (resolvedArgs) => {
        const [source, n] = resolvedArgs;
        const name = toString2(n);
        const items = [];
        if (source === null) return items;
        function scan(node) {
          Object.entries(node).forEach(([k, v]) => {
            if (k === name) items.push(v);
            if (typeof v === "object") scan(v);
          });
        }
        scan(source);
        return items;
      },
      _signature: [
        { types: [dataTypes_default.TYPE_OBJECT, dataTypes_default.TYPE_ARRAY, dataTypes_default.TYPE_NULL] },
        { types: [dataTypes_default.TYPE_STRING, dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * returns an array of a given object's property `[key, value]` pairs.
     * @param {object} obj Object whose `[key, value]` pairs need to be extracted
     * @returns {any[]} an array of [key, value] pairs
     * @function entries
     * @category JSONFormula
     * @example
     * entries({a: 1, b: 2}) //returns [['a', 1], ['b', 2]]
     */
    entries: {
      _func: (args) => {
        const obj = valueOf(args[0]);
        return Object.entries(obj);
      },
      _signature: [
        {
          types: [
            dataTypes_default.TYPE_NUMBER,
            dataTypes_default.TYPE_STRING,
            dataTypes_default.TYPE_ARRAY,
            dataTypes_default.TYPE_OBJECT,
            dataTypes_default.TYPE_BOOLEAN
          ]
        }
      ]
    },
    /**
     * Returns the serial number of the end of a month, given `startDate` plus `monthAdd` months
     * @param {number} startDate The base date to start from.
     * Dates should be entered by using the [datetime]{@link datetime} function
     * @param {integer} monthAdd Number of months to add to start date
     * @return {integer} the number of days in the computed month
     * @function
     * @category openFormula
     * @example
     * eomonth(datetime(2011, 1, 1), 1) | [month(@), day(@)] //returns [2, 28]
     * @example
     * eomonth(datetime(2011, 1, 1), -3) | [month(@), day(@)] //returns [10, 31]
     */
    eomonth: {
      _func: (args) => {
        const jsDate = getDateObj(args[0]);
        const months = args[1];
        const newDate = new Date(jsDate.getFullYear(), jsDate.getMonth() + months + 1, 0);
        return getDateNum(newDate);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Returns e (the base of natural logarithms) raised to a power x. (i.e. e<sup>x</sup>)
     * @param x {number} A numeric expression representing the power of e.
     * @returns {number} e (the base of natural logarithms) raised to a power x
     * @function exp
     * @category openFormula
     * @example
     * exp(10) //returns 22026.465794806718
     */
    exp: {
      _func: (args) => Math.exp(args[0]),
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Return constant boolean false value.
     * Note that expressions may also use the JSON literal false: `` `false` ``
     * @returns {boolean} constant boolean value `false`
     * @function
     * @category openFormula
     */
    false: {
      _func: () => false,
      _signature: []
    },
    /**
     * finds and returns the index of query in text from a start position
     * @param {string} query string to search
     * @param {string} text text in which the query has to be searched
     * @param {number} [start] zero-starting position: defaults to 0
     * @returns {number|null} the index of the query to be searched in the text. If not found
     * returns null
     * @function
     * @category openFormula
     * @example
     * find('m', 'abm') //returns 2
     * @example
     * find('M', 'abMcdM', 3) //returns 5
     * @example
     * find('M', 'ab') //returns `null`
     * @example
     * find('M', 'abMcdM', 2) //returns 2
     */
    find: {
      _func: (args) => {
        const query = args[0];
        const text = toString2(args[1]);
        const startPos = args.length > 2 ? args[2] : 0;
        const result = text.indexOf(query, startPos);
        if (result === -1) {
          return null;
        }
        return result;
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true }
      ]
    },
    /**
     * returns an object by transforming a list of key-value `pairs` into an object.
     * @param {any[]} pairs list of key-value pairs to create the object from
     * @returns {object}
     * @category JSONFormula
     * @function fromEntries
     * @example
     * fromEntries([['a', 1], ['b', 2]]) //returns {a: 1, b: 2}
     */
    fromEntries: {
      _func: (args) => {
        const array = args[0];
        return Object.fromEntries(array);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_ARRAY_ARRAY] }
      ]
    },
    /**
     * Extract the hour (0 through 23) from a time/datetime representation
     * @param {number} The datetime/time for which the hour is to be returned.
     * Dates should be specified using the [datetime]{@link datetime} or [time]{@link time} function
     * @return {number}
     * @function hour
     * @category openFormula
     * @example
     * hour(datetime(2008,5,23,12, 0, 0)) //returns 12
     * hour(time(12, 0, 0)) //returns 12
     */
    hour: {
      _func: (args) => {
        if (args[0] < 0) {
          return null;
        }
        return getDateObj(args[0]).getHours();
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Return one of two values `result1` or `result2`, depending on the `condition`
     * @returns {boolean} True
     * @param {any} condition logical expression to evaluate
     * @param {any} result1 if logical condition is true
     * @param {any} result2 if logical condition is false
     * @return {any} either result1 or result2
     * @function
     * @category openFormula
     * @example
     * if(true(), 1, 2) // returns 1
     * @example
     * if(false(), 1, 2) // returns 2
     */
    if: {
      _func: (unresolvedArgs, data, interpreter) => {
        const conditionNode = unresolvedArgs[0];
        const leftBranchNode = unresolvedArgs[1];
        const rightBranchNode = unresolvedArgs[2];
        const condition = interpreter.visit(conditionNode, data);
        if (valueOf(condition)) {
          return interpreter.visit(leftBranchNode, data);
        }
        return interpreter.visit(rightBranchNode, data);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_ANY] },
        { types: [dataTypes_default.TYPE_ANY] },
        { types: [dataTypes_default.TYPE_ANY] }
      ]
    },
    /**
     * Return a selected number of text characters from the left or
     * in case of array selected number of elements from the start
     * @param {string|array} subject The text/array of characters/elements to extract.
     * @param {number} [elements] number of elements to pick. Defaults to 1
     * @return {string|array}
     * @function left
     * @category openFormula
     * @example
     * left('Sale Price', 4) //returns 'Sale'
     * @example
     * left('Sweden') // returns 'S'
     * @example
     * left([4, 5, 6], 2) // returns [4, 5]
     */
    left: {
      _func: (args) => {
        const numEntries = args.length > 1 ? args[1] : 1;
        if (numEntries < 0) return null;
        if (args[0] instanceof Array) {
          return args[0].slice(0, numEntries);
        }
        const text = toString2(args[0]);
        return text.substr(0, numEntries);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING, dataTypes_default.TYPE_ARRAY] },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true }
      ]
    },
    /**
     * Converts all the alphabetic characters in a string to lowercase. If the value
     * is not a string it will be converted into string.
     * @param {string} input input string
     * @returns {string} the lower case value of the input string
     * @function lower
     * @category openFormula
     * @example
     * lower('E. E. Cummings') //returns e. e. cummings
     */
    lower: {
      _func: (args) => {
        const value = toString2(args[0]);
        return value.toLowerCase();
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    /**
     * Returns extracted text, given an original text, starting position, and length.
     * or in case of array, extracts a subset of the array from start till the length
     * number of elements.
     * Returns null if the `startPos` is greater than the length of the array
     * @param {string|array} subject the text string or array of characters or elements to extract.
     * @param {number} startPos the zero-position of the first character or element to extract.
     * The position starts with 0
     * @param {number} length The number of characters or elements to return from text. If it
     * is greater then the length of `subject` the argument is set to the length of the subject.
     * @return {string|array}
     * @function mid
     * @category openFormula
     * @example
     * mid('Fluid Flow',0,5) //returns 'Fluid'
     * @example
     * mid('Fluid Flow',6,20) //returns 'Flow'
     * @example
     * mid('Fluid Flow,20,5) //returns ''
     */
    mid: {
      _func: (args) => {
        const startPos = args[1];
        const numEntries = args[2];
        if (startPos < 0) return null;
        if (args[0] instanceof Array) {
          return args[0].slice(startPos, startPos + numEntries);
        }
        const text = toString2(args[0]);
        return text.substr(startPos, numEntries);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING, dataTypes_default.TYPE_ARRAY] },
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Extract the minute (0 through 59) from a time/datetime representation
     * @param {number} The datetime/time for which the minute is to be returned.
     * Dates should be specified using the [datetime]{@link datetime} or [time]{@link time} function
     * @return {number}
     * @function minute
     * @category openFormula
     * @example
     * minute(datetime(2008,5,23,12, 10, 0)) // returns 10
     * minute(time(12, 10, 0)) //returns 10
     */
    minute: {
      _func: (args) => {
        if (args[0] < 0) {
          return null;
        }
        return getDateObj(args[0]).getMinutes();
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Return the remainder when one number is divided by another number.
     * The sign is the same as divisor
     * @param {number} dividend The number for which to find the remainder.
     * @param {number} divisor The number by which to divide number.
     * @return {number} Computes the remainder of `dividend`/`divisor`.
     * @function mod
     * @category openFormula
     * @example
     * mod(3, 2) //returns 1
     * @example
     * mod(-3, 2) //returns -1
     */
    mod: {
      _func: (args) => {
        const p1 = args[0];
        const p2 = args[1];
        return p1 % p2;
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Returns the month of a date represented by a serial number.
     * The month is given as an integer, ranging from 1 (January) to 12 (December).
     * @param {number} The date for which the month is to be returned.
     * Dates should be entered by using the [datetime]{@link datetime} function
     * @return {number}
     * @function month
     * @category openFormula
     * @example
     * month(datetime(2008,5,23)) //returns 5
     */
    month: {
      // javascript months start from 0
      _func: (args) => getDateObj(args[0]).getMonth() + 1,
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Compute logical NOT of a `value`. If the parameter is not boolean it will be cast to boolean
     * as per the following rules
     * * null -> false
     * * number -> false if the number is 0, true otherwise
     * * string -> false if the string is empty, true otherwise. String "false" resolves to true
     * * array -> true
     * * object -> true
     * Note that it is also possible to use the logical and operator: `A && B`
     * @param {any} value - any data type
     * @returns {boolean} The logical NOT applied to the input parameter
     * @example
     * not(length('bar') > 0) // returns false
     * @example
     * not(false()) // returns true
     * @example
     * not('abcd') // returns false
     * @example
     * not('') // returns true
     * @function
     * @category openFormula
     */
    not: {
      _func: (resolveArgs) => !valueOf(resolveArgs[0]),
      _signature: [{ types: [dataTypes_default.TYPE_ANY] }]
    },
    /**
     * returns the time since epoch with days as exponent and time of day as fraction
     * @return {number} representation of current time as a number
     * @function now
     * @category openFormula
     */
    now: {
      _func: () => getDateNum(Date.now()),
      _signature: []
    },
    /**
     * Return constant null value.
     * Note that expressions may also use the JSON literal null: `` `null` ``
     * @returns {boolean} True
     * @function
     * @category JSONFormula
     */
    null: {
      _func: () => null,
      _signature: []
    },
    /**
     * Returns the logical OR result of two parameters.
     * If the parameters are not boolean they will be cast to boolean as per the following rules
     * * null -> false
     * * number -> false if the number is 0, true otherwise
     * * string -> false if the string is empty, true otherwise. String "false" resolves to true
     * * array -> true
     * * object -> true
     * @param {any} first logical expression
     * @param {...any} [operand] any number of additional expressions
     * @returns {boolean} The logical result of applying OR to all parameters
     * @example
     * or((x / 2) == y, (y * 2) == x)
     * // true
     * @function
     * @category openFormula
     */
    or: {
      _func: (resolvedArgs) => {
        let result = !!valueOf(resolvedArgs[0]);
        resolvedArgs.slice(1).forEach((arg) => {
          result = result || !!valueOf(arg);
        });
        return result;
      },
      _signature: [{ types: [dataTypes_default.TYPE_ANY], variadic: true }]
    },
    /**
     * Computes `a` raised to a power `x`. (a<sup>x</sup>)
     * @param {number} a The base number. It can be any real number.
     * @param {number} x The exponent to which the base number is raised.
     * @return {number}
     * @function power
     * @category openFormula
     * @example
     * power(10, 2) //returns 100 (10 raised to power 2)
     */
    power: {
      _func: (args) => args[0] ** args[1],
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Return the input string with the first letter of each word converted to an
     * uppercase letter and the rest of the letters in the word converted to lowercase.
     * @param {string} text the text to partially capitalize.
     * @returns {string}
     * @function proper
     * @category openFormula
     * @example
     * proper('this is a TITLE') //returns 'This Is A Title'
     * @example
     * proper('2-way street') //returns '2-Way Street'
     * @example
     * proper('76BudGet') //returns '76Budget'
     */
    proper: {
      _func: (args) => {
        const capitalize = (word) => /\w/.test(word) ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}` : word;
        const original = toString2(args[0]);
        const wordParts = original.match(/\W+|\w+/g);
        if (wordParts === null) return original;
        const words = wordParts.map((word) => {
          const digitParts = word.match(/\d+|[^\d]+/g);
          if (digitParts === null) return capitalize(word);
          return digitParts.map((part) => capitalize(part)).join("");
        });
        return words.join("");
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    /**
     * Returns a pseudo random number that is greater than or equal to zero, and less than one.
     * @returns {number}
     * @function random
     * @category openFormula
     * @example
     * random() // 0.022585461160693265
     */
    random: {
      _func: () => Math.random(),
      _signature: []
    },
    /**
     * Returns text where an old text is substituted at a given start position and
     * length, with a new text.
     * @param {string} text original text
     * @param {number} start zero-based index in the original text
     * from where to begin the replacement.
     * @param {number} length number of characters to be replaced
     * @param {string} replacement string to replace at the start index
     * @returns {string}
     * @function replace
     * @category openFormula
     * @example
     * replace('abcdefghijk', 5, 5, '*') //returns abcde*k
     * @example
     * replace('2009',2,2,'10') //returns  2010
     * @example
     * replace('123456',0,3,'@') //returns @456
     */
    replace: {
      _func: (args) => {
        const oldText = toString2(args[0]);
        const startNum = args[1];
        const numChars = args[2];
        const newText = toString2(args[3]);
        if (startNum < 0) {
          return null;
        }
        const lhs = oldText.substr(0, startNum);
        const rhs = oldText.substr(startNum + numChars);
        return lhs + newText + rhs;
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    /**
     * Return text repeated Count times.
     * @param {string} text text to repeat
     * @param {number} count number of times to repeat the text
     * @returns {string}
     * @function rept
     * @category openFormula
     * @example
     * rept('x', 5) //returns 'xxxxx'
     */
    rept: {
      _func: (args) => {
        const text = toString2(args[0]);
        const count = args[1];
        if (count < 0) {
          return null;
        }
        return text.repeat(count);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Return a selected number of text characters from the right of a `subject` or
     * in case of array selected number of elements from the end of `subject` array
     * Returns null if the number of elements is less than 0
     * @param {string|array} subject The text/array containing the characters/elements to extract.
     * @param {number} [elements] number of elements to pick. Defaults to 1
     * @return {string|array}
     * @function right
     * @category openFormula
     * @example
     * right('Sale Price', 4) //returns 'rice'
     * @example
     * right('Sweden') // returns 'n'
     * @example
     * right([4, 5, 6], 2) // returns [5, 6]
     */
    right: {
      _func: (args) => {
        const numEntries = args.length > 1 ? args[1] : 1;
        if (numEntries < 0) return null;
        if (args[0] instanceof Array) {
          if (numEntries === 0) return [];
          return args[0].slice(numEntries * -1);
        }
        const text = toString2(args[0]);
        const start = text.length - numEntries;
        return text.substr(start, numEntries);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING, dataTypes_default.TYPE_ARRAY] },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true }
      ]
    },
    /**
     * Round a number to a specified `precision`.
     * ### Remarks
     * * If `precision` is greater than zero, round to the specified number of decimal places.
     * * If `precision` is 0, round to the nearest integer.
     * * If `precision` is less than 0, round to the left of the decimal point.
     * @param {number} num number to round off
     * @param {number} precision number is rounded to the specified precision.
     * @returns {number}
     * @function round
     * @category openFormula
     * @example
     * round(2.15, 1) //returns 2.2
     * @example
     * round(626.3,-3) //returns 1000 (Rounds 626.3 to the nearest multiple of 1000)
     * @example
     * round(626.3, 0) //returns 626
     * @example
     * round(1.98,-1) //returns 0 (Rounds 1.98 to the nearest multiple of 10)
     * @example
     * round(-50.55,-2) // -100 (round -50.55 to the nearest multiple of 100)
     */
    round: {
      _func: (args) => round(args[0], args[1]),
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Perform a wildcard search.  The search is case-sensitive and supports two forms of wildcards:
     * "*" finds a a sequence of characters and "?" finds a single character.
     * To use "*" or "?" as text values, precede them with a tilde ("~") character.
     * Note that the wildcard search is not greedy.
     * e.g. search('a*b', 'abb') will return [0, 'ab'] Not [0, 'abb']
     * @param {string} findText the search string -- which may include wild cards.
     * @param {string} withinText The string to search.
     * @param {integer} startPos The zero-based position of withinText to start searching.
     * Defaults to zero.
     * @returns {array} returns an array with two values:
     * The start position of the found text and the text string that was found.
     * If a match was not found, an empty array is returned.
     * @function search
     * @category openFormula
     * @example
     * search('a?c', 'acabc') //returns [2, 'abc']
     */
    search: {
      _func: (args) => {
        const findText = toString2(args[0]);
        const withinText = toString2(args[1]);
        const startPos = args.length > 2 ? args[2] : 0;
        if (findText === null || withinText === null || withinText.length === 0) return [];
        const reString = findText.replace(/([[.\\^$()+{])/g, "\\$1").replace(/~?\?/g, (match) => match === "~?" ? "\\?" : ".").replace(/~?\*/g, (match) => match === "~*" ? "\\*" : ".*?").replace(/~~/g, "~");
        const re = new RegExp(reString);
        const result = withinText.substring(startPos).match(re);
        if (result === null) return [];
        return [result.index + startPos, result[0]];
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true }
      ]
    },
    /**
     * Extract the second (0 through 59) from a time/datetime representation
     * @param {number} The datetime/time for which the second is to be returned.
     * Dates should be specified using the [datetime]{@link datetime} or [time]{@link time} function
     * @return {number}
     * @function second
     * @category openFormula
     * @example
     * second(datetime(2008,5,23,12, 10, 53)) //returns 53
     * second(time(12, 10, 53)) //returns 53
     */
    second: {
      _func: (args) => args[0] < 0 ? null : getDateObj(args[0]).getSeconds(),
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * split a string into an array, given a separator
     * @param {string} string string to split
     * @param {string} separator separator where the split should occur
     * @return {string[]}
     * @function split
     * @category openFormula
     * @example
     * split('abcdef', '') //returns ['a', 'b', 'c', 'd', 'e', 'f']
     * @example
     * split('abcdef', 'e') //returns ['abcd', 'f']
     */
    split: {
      _func: (args) => {
        const str = toString2(args[0]);
        const separator = toString2(args[1]);
        return str.split(separator);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    /**
     * Return the square root of a number
     * @param {number} num number whose square root has to be calculated
     * @return {number}
     * @function sqrt
     * @category openFormula
     * @example
     * sqrt(4) //returns 2
     */
    sqrt: {
      _func: (args) => {
        const result = Math.sqrt(args[0]);
        return Number.isNaN(result) ? null : result;
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Estimates standard deviation based on a sample.
     * `stdev` assumes that its arguments are a sample of the entire population.
     * If your data represents a entire population,
     * then compute the standard deviation using [stdevp]{@link stdevp}.
     * @param {number[]} numbers The array of numbers comprising the population
     * @returns {number}
     * @category openFormula
     * @function stdev
     * @example
     * stdev([1345, 1301, 1368]) //returns 34.044089061098404
     * stdevp([1345, 1301, 1368]) //returns 27.797
     */
    stdev: {
      _func: (args) => {
        const values = args[0];
        if (values.length <= 1) {
          return null;
        }
        const coercedValues = values.map((value) => toNumber(value));
        const mean = coercedValues.reduce((a, b) => a + b, 0) / values.length;
        const sumSquare = coercedValues.reduce((a, b) => a + b * b, 0);
        const result = Math.sqrt((sumSquare - values.length * mean * mean) / (values.length - 1));
        if (Number.isNaN(result)) {
          return null;
        }
        return result;
      },
      _signature: [
        { types: [dataTypes_default.TYPE_ARRAY_NUMBER] }
      ]
    },
    /**
     * Calculates standard deviation based on the entire population given as arguments.
     * `stdevp` assumes that its arguments are the entire population.
     * If your data represents a sample of the population,
     * then compute the standard deviation using [stdev]{@link stdev}.
     * @param {number[]} numbers The array of numbers comprising the population
     * @returns {number}
     * @category openFormula
     * @function stdevp
     * @example
     * stdevp([1345, 1301, 1368]) //returns 27.797
     * stdev([1345, 1301, 1368]) //returns 34.044
     */
    stdevp: {
      _func: (args) => {
        const values = args[0];
        if (values.length === 0) {
          return null;
        }
        const coercedValues = values.map((value) => toNumber(value));
        const mean = coercedValues.reduce((a, b) => a + b, 0) / values.length;
        const meanSumSquare = coercedValues.reduce((a, b) => a + b * b, 0) / values.length;
        const result = Math.sqrt(meanSumSquare - mean * mean);
        return Number.isNaN(result) ? null : result;
      },
      _signature: [
        { types: [dataTypes_default.TYPE_ARRAY_NUMBER] }
      ]
    },
    /**
     * Returns input `text`, with text `old` replaced by text `new` (when searching from the left).
     * If `which` parameter is omitted, every occurrence of `old` is replaced with `new`;
     * If `which` is provided, only that occurrence of `old` is replaced by `new`
     * (starting the count from 1).
     * If there is no match, or if `old` has length 0, `text` is returned unchanged.
     * Note that `old` and `new` may have different lengths. If `which` < 1, return `text` unchanged
     * @param {string} text The text for which to substitute characters.
     * @param {string} old The text to replace.
     * @param {string} new The text to replace `old` with.
     * @param {integer} [which] The one-based occurrence of `old` text to replace with `new` text.
     * @returns {string} replaced string
     * @function
     * @category openFormula
     * @example
     * substitute('Sales Data', 'Sales', 'Cost') //returns 'Cost Data'
     * @example
     * substitute('Quarter 1, 2008', '1', '2', 1) //returns 'Quarter 2, 2008'
     * @example
     * substitute('Quarter 1, 1008', '1', '2', 2) //returns 'Quarter 1, 2008'
     */
    substitute: {
      _func: (args) => {
        const src = toString2(args[0]);
        const old = args[1];
        const replacement = args[2];
        if (args.length <= 3) return src.replaceAll(old, replacement);
        const whch = args[3];
        if (whch < 1) return src;
        let pos = -1;
        for (let i = 0; i < whch; i += 1) {
          pos += 1;
          const nextFind = src.slice(pos).indexOf(old);
          if (nextFind === -1) return src;
          pos += nextFind;
        }
        return src.slice(0, pos) + src.slice(pos).replace(old, replacement);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_STRING] },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true }
      ]
    },
    /**
     * Construct and returns time from hours, minutes, and seconds.
     * @param {integer} hours Integer value between 0 and 23 representing the hour of the day.
     * Defaults to 0.
     * @param {integer} minutes Integer value representing the minute segment of a time.
     * The default is 0 minutes past the hour.
     * @param {integer} seconds Integer value representing the second segment of a time.
     * The default is 0 seconds past the minute.
     * @return {number} Returns the fraction of the day consumed by the given time
     * @function time
     * @category openFormula
     * @example
     * time(12, 0, 0) | [hour(@), minute(@), second(@)] //returns [12, 0, 0]
     */
    time: {
      _func: (args) => {
        const hours = args[0];
        const minutes = args.length > 1 ? args[1] : 0;
        const seconds = args.length > 2 ? args[2] : 0;
        if (hours < 0 || minutes < 0 || seconds < 0) return null;
        const epochTime = new Date(1970, 0, 1, hours, minutes, seconds);
        return getDateNum(epochTime);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true }
      ]
    },
    /**
     * returns the number of days since epoch
     * @return number
     * @function today
     * @category openFormula
     */
    today: {
      _func: () => {
        const now = new Date(Date.now());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return getDateNum(today);
      },
      _signature: []
    },
    /**
     * Remove leading and trailing spaces, and replace all internal multiple spaces
     * with a single space.
     * @param {string} text string to trim
     * @return {string} removes all leading and trailing space.
     * Any other sequence of 2 or more spaces is replaced with a single space.
     * @function trim
     * @category openFormula
     * @example
     * trim('   ab    c   ') //returns 'ab c'
     */
    trim: {
      _func: (args) => {
        const text = toString2(args[0]);
        return text.split(" ").filter((x) => x).join(" ");
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    /**
     * Return constant boolean true value.
     * Note that expressions may also use the JSON literal true: `` `true` ``
     * @returns {boolean} True
     * @function
     * @category openFormula
     */
    true: {
      _func: () => true,
      _signature: []
    },
    /**
     * Truncates a number to an integer by removing the fractional part of the number.
     * @param {number} numA number to truncate
     * @param {number} [numB] A number specifying the precision of the truncation. Default is 0
     * @return {number}
     * @function trunc
     * @category openFormula
     * @example
     * trunc(8.9) //returns 8
     * trunc(-8.9) //returns -8
     * trunc(8.912, 2) //returns 8.91
     */
    trunc: {
      _func: (args) => {
        const number = args[0];
        const digits = args.length > 1 ? args[1] : 0;
        const method = number >= 0 ? Math.floor : Math.ceil;
        return method(number * 10 ** digits) / 10 ** digits;
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true }
      ]
    },
    /**
     * takes an array and returns unique elements within it
     * @param {array} input input array
     * @return {array} array with duplicate elements removed
     * @function unique
     * @category JSONFormula
     * @example
     * unique([1, 2, 3, 4, 1, 1, 2]) //returns [1, 2, 3, 4]
     */
    unique: {
      _func: (args) => {
        const valueArray = args[0].map((a) => valueOf(a));
        return args[0].filter((v, index) => valueArray.indexOf(valueOf(v)) === index);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_ARRAY] }
      ]
    },
    /**
     * Converts all the alphabetic characters in a string to uppercase.
     * If the value is not a string it will be converted into string
     * using the default toString method
     * @param {string} input input string
     * @returns {string} the upper case value of the input string
     * @function upper
     * @category openFormula
     * @example
     * upper('abcd') //returns 'ABCD'
     */
    upper: {
      _func: (args) => toString2(args[0]).toUpperCase(),
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    /**
     * Perform an indexed lookup on a map or array
     * @param {map | array} object on which to perform the lookup
     * @param {string | integer} index: a named child for a map or an integer offset for an array
     * @returns {any} the result of the lookup -- or `null` if not found.
     * @function
     * @category JSONFormula
     * @example
     * value({a: 1, b:2, c:3}, 'a') //returns 1
     * @example
     * value([1, 2, 3, 4], 2) //returns 3
     */
    value: {
      _func: (args) => {
        const obj = args[0] || {};
        const index = args[1];
        const result = getProperty(obj, index);
        if (result === void 0) {
          debugAvailable(debug, obj, index);
          return null;
        }
        return result;
      },
      _signature: [
        { types: [dataTypes_default.TYPE_OBJECT, dataTypes_default.TYPE_ARRAY, dataTypes_default.TYPE_NULL] },
        { types: [dataTypes_default.TYPE_STRING, dataTypes_default.TYPE_NUMBER] }
      ]
    },
    /**
     * Extract the day of the week from a date; if text, uses current locale to convert to a date.
     * @param {number} The datetime for which the day of the week is to be returned.
     * Dates should be entered by using the [datetime]{@link datetime} function
     * @param {number} [returnType] A number that determines the
     * numeral representation (a number from 0 to 7) of the
     * day of week. Default is 1. Supports the following values
     * * 1 : Sunday (1), Monday (2), ..., Saturday (7)
     * * 2 : Monday (1), Tuesday (2), ..., Sunday(7)
     * * 3 : Monday (0), Tuesday (2), ...., Sunday(6)
     * @returns {number} day of the week
     * @function weekday
     * @category openFormula
     * @example
     * weekday(datetime(2006,5,21)) // 1
     * @example
     * weekday(datetime(2006,5,21), 2) // 7
     * @example
     * weekday(datetime(2006,5,21), 3) // 6
     */
    weekday: {
      _func: (args) => {
        const date = args[0];
        const type = args.length > 1 ? args[1] : 1;
        const jsDate = getDateObj(date);
        const day = jsDate.getDay();
        switch (type) {
          case 1:
            return day + 1;
          case 2:
            return (day + 6) % 7 + 1;
          case 3:
            return (day + 6) % 7;
          default:
            return null;
        }
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] },
        { types: [dataTypes_default.TYPE_NUMBER], optional: true }
      ]
    },
    /**
     * Returns the year of a date represented by a serial number.
     * @param {number} The date for which the year is to be returned.
     * Dates should be entered by using the [datetime]{@link datetime} function
     * @return {number}
     * @function year
     * @category openFormula
     * @example
     * year(datetime(2008,5,23)) //returns 2008
     */
    year: {
      _func: (args) => getDateObj(args[0]).getFullYear(),
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    charCode: {
      _func: (args) => {
        const code = args[0];
        return !Number.isInteger(code) ? null : String.fromCharCode(code);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_NUMBER] }
      ]
    },
    codePoint: {
      _func: (args) => {
        const text = toString2(args[0]);
        return text.length === 0 ? null : text.codePointAt(0);
      },
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    encodeUrlComponent: {
      _func: (args) => encodeURIComponent(args[0]),
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    encodeUrl: {
      _func: (args) => encodeURI(args[0]),
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    decodeUrlComponent: {
      _func: (args) => decodeURIComponent(args[0]),
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    },
    decodeUrl: {
      _func: (args) => decodeURI(args[0]),
      _signature: [
        { types: [dataTypes_default.TYPE_STRING] }
      ]
    }
  };
}

// node_modules/@adobe/json-formula/src/jmespath/functions.js
function functions(runtime, isObject2, isArray2, toNumber, getTypeName2, valueOf, toString2, debug) {
  const {
    TYPE_NUMBER: TYPE_NUMBER2,
    TYPE_ANY: TYPE_ANY3,
    TYPE_STRING: TYPE_STRING3,
    TYPE_ARRAY: TYPE_ARRAY3,
    TYPE_OBJECT: TYPE_OBJECT2,
    TYPE_BOOLEAN: TYPE_BOOLEAN2,
    TYPE_EXPREF: TYPE_EXPREF2,
    TYPE_NULL: TYPE_NULL2,
    TYPE_ARRAY_NUMBER: TYPE_ARRAY_NUMBER2,
    TYPE_ARRAY_STRING: TYPE_ARRAY_STRING3
  } = dataTypes_default;
  const functionMap = {
    // name: [function, <signature>]
    // The <signature> can be:
    //
    // {
    //   args: [[type1, type2], [type1, type2]],
    //   variadic: true|false
    // }
    //
    // Each arg in the arg list is a list of valid types
    // (if the function is overloaded and supports multiple
    // types.  If the type is "any" then no type checking
    // occurs on the argument.  Variadic is optional
    // and if not provided is assumed to be false.
    /**
     * Returns the absolute value of the provided argument `value`.
     * @param {number} value argument whose absolute value has to be returned
     * @return {number} returns the absolute value of the `value` argument
     * @function abs
     * @example
     * abs(-1) //returns 1
     * @category jmespath
     */
    abs: {
      _func: (resolvedArgs) => Math.abs(resolvedArgs[0]),
      _signature: [{ types: [TYPE_NUMBER2] }]
    },
    /**
     * Returns the average of the elements in the provided array.
     * An empty array will produce a return value of `null`.
     * @param {number[]} elements array of elements whose average has to be computed
     * @return {number} average value
     * @function avg
     * @example
     * avg(`[]`) //returns null
     * @example
     * avg([1, 2, 3]) //returns 2
     * @category jmespath
     */
    avg: {
      _func: (resolvedArgs) => {
        let sum = 0;
        const inputArray = resolvedArgs[0];
        if (inputArray.length === 0) return null;
        inputArray.forEach((a) => {
          sum += a;
        });
        return sum / inputArray.length;
      },
      _signature: [{ types: [TYPE_ARRAY_NUMBER2] }]
    },
    /**
     * Returns the next highest integer value of the argument `num` by rounding up if necessary.
     * @param {number} num number whose next highest integer value has to be computed
     * @return {number}
     * @function ceil
     * @example
     * ceil(10) //returns 10
     * @example
     * ceil(10.4) //return 11
     * @category jmespath
     */
    ceil: {
      _func: (resolvedArgs) => Math.ceil(resolvedArgs[0]),
      _signature: [{ types: [TYPE_NUMBER2] }]
    },
    /**
     * Returns true if the given `subject` contains the provided `search` string.
     * If `subject` is an array, this function returns true if one of the elements
     * in the array is equal to the provided `search` value. If the provided `subject`
     *  is a string, this function returns true if the string contains the provided
     * `search` argument.
     * @param {array|string} subject the subject in which the element has to be searched
     * @param {string|boolean|number|date} search element to search
     * @return {boolean}
     * @function contains
     * @example
     * contains([1, 2, 3, 4], 2) //returns true
     * @example
     * contains([1, 2, 3, 4], -1) //returns false
     * @example
     * contains('Abcd', 'd') //returns true
     * @example
     * contains('Abcd', 'x') //returns false
     * @category jmespath
     */
    contains: {
      _func: (resolvedArgs) => valueOf(resolvedArgs[0]).indexOf(valueOf(resolvedArgs[1])) >= 0,
      _signature: [
        { types: [TYPE_STRING3, TYPE_ARRAY3] },
        { types: [TYPE_ANY3] }
      ]
    },
    /**
     * Returns true if the `subject` ends with the `suffix`, otherwise this function returns false.
     * @param {string} subject subject in which the `suffix` is being searched for
     * @param {string} suffix suffix to search in the subject
     * @return {boolean}
     * @function endsWith
     * @example
     * endsWith('Abcd', 'd') //returns true
     * @example
     * endsWith('Abcd', 'A') //returns false
     * @category jmespath
     */
    endsWith: {
      _func: (resolvedArgs) => {
        const searchStr = valueOf(resolvedArgs[0]);
        const suffix = valueOf(resolvedArgs[1]);
        return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1;
      },
      _signature: [{ types: [TYPE_STRING3] }, { types: [TYPE_STRING3] }]
    },
    /**
     * Returns the next lowest integer value of the argument `num` by rounding down if necessary.
     * @param {number} num number whose next lowest integer value has to be returned
     * @return {number}
     * @function floor
     * @example
     * floor(10.4) //returns 10
     * @example
     * floor(10) //returns 10
     * @category jmespath
     */
    floor: {
      _func: (resolvedArgs) => Math.floor(resolvedArgs[0]),
      _signature: [{ types: [TYPE_NUMBER2] }]
    },
    /**
     * Returns all the elements from the provided `stringsarray`
     * array joined together using the `glue` argument as a separator between each.
     * @param {string} glue
     * @param {string[]} stringsarray
     * @return {string}
     * @function join
     * @example
     * join(',', ['a', 'b', 'c']) //returns 'a,b,c'
     * @category jmespath
     */
    join: {
      _func: (resolvedArgs) => {
        const joinChar = resolvedArgs[0];
        const listJoin = resolvedArgs[1];
        return listJoin.join(joinChar);
      },
      _signature: [
        { types: [TYPE_STRING3] },
        { types: [TYPE_ARRAY_STRING3] }
      ]
    },
    /**
     * Returns an array containing the keys of the provided object `obj`. If the passed
     * object is null, the value returned is an empty array
     * @param {object} obj the object whose keys need to be extracted
     * @return {array}
     * @function keys
     * @example
     * keys({a : 3, b : 4}) //returns ['a', 'b']
     * @category jmespath
     */
    keys: {
      _func: (resolvedArgs) => {
        if (resolvedArgs[0] === null) return [];
        return Object.keys(resolvedArgs[0]);
      },
      _signature: [{ types: [TYPE_ANY3] }]
    },
    /**
     * Returns the length of the given argument `subject` using the following types rules:
     * * string: returns the number of code points in the string
     * * array: returns the number of elements in the array
     * * object: returns the number of key-value pairs in the object
     * @param {string | array | object} subject subject whose length has to be calculated
     * @return {number}
     * @function length
     * @example
     * length(`[]`) //returns 0
     * @example
     * length('') //returns 0
     * @example
     * length('abcd') //returns 4
     * @example
     * length([1, 2, 3, 4]) //returns 4
     * @example
     * length({}) // returns 0
     * @example
     * length({a : 3, b : 4}) //returns 2
     * @category jmespath
     */
    length: {
      _func: (resolvedArgs) => {
        const arg = valueOf(resolvedArgs[0]);
        if (isObject2(arg)) return Object.keys(arg).length;
        return isArray2(arg) ? arg.length : toString2(arg).length;
      },
      _signature: [{ types: [TYPE_STRING3, TYPE_ARRAY3, TYPE_OBJECT2] }]
    },
    /**
     * Apply the `expr` to every element in the `elements` array and return the array of results.
     * An elements of length N will produce a return array of length N. Unlike a projection,
     * `[*].bar`, `map()` will include the result of applying the `expr` for every element
     * in the elements array, even if the result is `null`.
     * @param {expression} expr expression to evaluate on each element
     * @param {array} elements array of elements on which the expression will be evaluated
     * @return {array}
     * @function map
     * @example
     * map(&(@ + 1), [1, 2, 3, 4]) // returns [2, 3, 4, 5]
     * @example
     * map(&length(@), ['doe', 'nick', 'chris']) // returns [3,4, 5]
     * @category jmespath
     */
    map: {
      _func: (resolvedArgs) => {
        const exprefNode = resolvedArgs[0];
        return resolvedArgs[1].map((arg) => runtime.interpreter.visit(exprefNode, arg));
      },
      _signature: [{ types: [TYPE_EXPREF2] }, { types: [TYPE_ARRAY3] }]
    },
    /**
     * Returns the highest value in the provided `collection` arguments.
     * If all collections are empty `null` is returned.
     * max() can work on numbers or strings.
     * If a mix of numbers and strings are provided, the type of the first value will be used.
     * @param {number[]|string[]} collection array in which the maximum element is to be calculated
     * @return {number}
     * @function max
     * @example
     * max([1, 2, 3], [4, 5, 6], 7) //returns 7
     * @example
     * max(`[]`) // returns null
     * @example
     * max(['a', 'a1', 'b']) // returns 'b'
     * @category jmespath
     */
    max: {
      _func: (args) => {
        const array = args.reduce((prev, cur) => {
          if (Array.isArray(cur)) prev.push(...cur);
          else prev.push(cur);
          return prev;
        }, []);
        const first = array.find((r) => r !== null);
        if (array.length === 0 || first === void 0) return null;
        const isNumber = getTypeName2(first, true) === TYPE_NUMBER2;
        const compare = isNumber ? (prev, cur) => {
          const current = toNumber(cur);
          return prev <= current ? current : prev;
        } : (prev, cur) => {
          const current = toString2(cur);
          return prev.localeCompare(current) === 1 ? prev : current;
        };
        return array.reduce(compare, isNumber ? toNumber(first) : toString2(first));
      },
      _signature: [{ types: [TYPE_ARRAY3, TYPE_ARRAY_NUMBER2, TYPE_ARRAY_STRING3], variadic: true }]
    },
    /**
     * Accepts 0 or more objects as arguments, and returns a single object with
     * subsequent objects merged. Each subsequent object’s key/value pairs are
     * added to the preceding object. This function is used to combine multiple
     * objects into one. You can think of this as the first object being the base object,
     * and each subsequent argument being overrides that are applied to the base object.
     * @param {...object} args
     * @return {object}
     * @function merge
     * @example
     * merge({a: 1, b: 2}, {c : 3, d: 4}) // returns {a :1, b: 2, c: 3, d: 4}
     * @example
     * merge({a: 1, b: 2}, {a : 3, d: 4}) // returns {a :3, b: 2, d: 4}
     * @category jmespath
     */
    merge: {
      _func: (resolvedArgs) => {
        const merged = {};
        resolvedArgs.forEach((current) => {
          if (current === null) return;
          Object.entries(current || {}).forEach(([key, value]) => {
            merged[key] = value;
          });
        });
        return merged;
      },
      _signature: [{ types: [TYPE_OBJECT2, TYPE_NULL2], variadic: true }]
    },
    /**
     * Returns the lowest value in the provided `collection` arguments.
     * If all collections are empty `null` is returned.
     * min() can work on numbers or strings.
     * If a mix of numbers and strings are provided, the type of the first value will be used.
     * @param {number[]|string[]} collection array in which the minimum element is to be calculated
     * @return {number}
     * @function min
     * @example
     * min([1, 2, 3], [4, 5, 6], 7) //returns 1
     * @example
     * min(`[]`) // returns null
     * @example
     * min(['a', 'a1', 'b']) // returns 'a'
     * @category jmespath
     */
    min: {
      _func: (args) => {
        const array = args.reduce((prev, cur) => {
          if (Array.isArray(cur)) prev.push(...cur);
          else prev.push(cur);
          return prev;
        }, []);
        const first = array.find((r) => r !== null);
        if (array.length === 0 || first === void 0) return null;
        const isNumber = getTypeName2(first, true) === TYPE_NUMBER2;
        const compare = isNumber ? (prev, cur) => {
          const current = toNumber(cur);
          return prev <= current ? prev : current;
        } : (prev, cur) => {
          const current = toString2(cur);
          return prev.localeCompare(current) === 1 ? current : prev;
        };
        return array.reduce(compare, isNumber ? toNumber(first) : toString2(first));
      },
      _signature: [{ types: [TYPE_ARRAY3, TYPE_ARRAY_NUMBER2, TYPE_ARRAY_STRING3], variadic: true }]
    },
    /**
     * Returns the first argument that does not resolve to `null`.
     * This function accepts one or more arguments, and will evaluate
     * them in order until a non null argument is encounted. If all
     * arguments values resolve to null, then a value of null is returned.
     * @param {...any} argument
     * @return {any}
     * @function notNull
     * @example
     * notNull(1, 2, 3, 4, `null`) //returns 1
     * @example
     * notNull(`null`, 2, 3, 4, `null`) //returns 2
     * @category jmespath
     */
    notNull: {
      _func: (resolvedArgs) => resolvedArgs.find((arg) => getTypeName2(arg) !== TYPE_NULL2) || null,
      _signature: [{ types: [TYPE_ANY3], variadic: true }]
    },
    /**
     * executes a user-supplied reducer expression `expr` on each element of the
     * array, in order, passing in the return value from the calculation on the preceding element.
     * The final result of running the reducer across all elements of the `elements` array is a
     * single value.
     * The expression can access the following properties
     * * accumulated: accumulated value based on the previous calculations. Initial value is `null`
     * * current: current element to process
     * * index: index of the `current` element in the array
     * * array: original array
     * @param {expression} expr reducer expr to be executed on each element
     * @param {array} elements array of elements on which the expression will be evaluated
     * @return {any}
     * @function reduce
     * @example
     * reduce(&(accumulated + current), [1, 2, 3]) //returns 6
     * @example
     * // find maximum entry by age
     * reduce(
     *   &max(@.accumulated.age, @.current.age),
     *   [{age: 10, name: 'Joe'},{age: 20, name: 'John'}], @[0].age
     * )
     * @example
     * reduce(&if(accumulated == `null`, current, accumulated * current), [3, 3, 3]) //returns 27
     * @category jmespath
     */
    reduce: {
      _func: (resolvedArgs) => {
        const exprefNode = resolvedArgs[0];
        return resolvedArgs[1].reduce(
          (accumulated, current, index, array) => runtime.interpreter.visit(exprefNode, {
            accumulated,
            current,
            index,
            array
          }),
          resolvedArgs.length === 3 ? resolvedArgs[2] : null
        );
      },
      _signature: [
        { types: [TYPE_EXPREF2] },
        { types: [TYPE_ARRAY3] },
        { types: [TYPE_ANY3], optional: true }
      ]
    },
    /**
     * Register a function to allow code re-use.  The registered function may take one parameter.
     * If more parameters are needed, combine them in an array or map.
     * @param {string} functionName Name of the function to register
     * @param {expression} expr Expression to execute with this function call
     * @return {{}} returns an empty object
     * @function register
     * @example
     * register('product', &@[0] * @[1]) // can now call: product([2,21]) => returns 42
     * @category jmespath
     */
    register: {
      _func: (resolvedArgs) => {
        const functionName = resolvedArgs[0];
        const exprefNode = resolvedArgs[1];
        if (functionMap[functionName] && !functionMap[functionName].custom) {
          debug.push(`Cannot override function: '${functionName}'`);
          return {};
        }
        functionMap[functionName] = {
          _func: (args) => runtime.interpreter.visit(exprefNode, ...args),
          _signature: [{ types: [TYPE_ANY3], optional: true }],
          _custom: true
        };
        return {};
      },
      _signature: [
        { types: [TYPE_STRING3] },
        { types: [TYPE_EXPREF2] }
      ]
    },
    /**
     * Reverses the order of the `argument`.
     * @param {string|array} argument
     * @return {array}
     * @function reverse
     * @example
     * reverse(['a', 'b', 'c']) //returns ['c', 'b', 'a']
     * @category jmespath
     */
    reverse: {
      _func: (resolvedArgs) => {
        const originalStr = valueOf(resolvedArgs[0]);
        const typeName = getTypeName2(originalStr);
        if (typeName === TYPE_STRING3) {
          let reversedStr = "";
          for (let i = originalStr.length - 1; i >= 0; i -= 1) {
            reversedStr += originalStr[i];
          }
          return reversedStr;
        }
        const reversedArray = resolvedArgs[0].slice(0);
        reversedArray.reverse();
        return reversedArray;
      },
      _signature: [{ types: [TYPE_STRING3, TYPE_ARRAY3] }]
    },
    /**
     * This function accepts an array `list` argument and returns the sorted elements of
     * the `list` as an array. The array must be a list of strings or numbers.
     * Sorting strings is based on code points. Locale is not taken into account.
     * @param {number[]|string[]} list
     * @return {number[]|string[]}
     * @function sort
     * @example
     * sort([1, 2, 4, 3, 1]) // returns [1, 1, 2, 3, 4]
     * @category jmespath
     */
    sort: {
      _func: (resolvedArgs) => {
        const sortedArray = resolvedArgs[0].slice(0);
        if (sortedArray.length > 0) {
          const normalize = getTypeName2(resolvedArgs[0][0]) === TYPE_NUMBER2 ? toNumber : toString2;
          sortedArray.sort((a, b) => {
            const va = normalize(a);
            const vb = normalize(b);
            if (va < vb) return -1;
            if (va > vb) return 1;
            return 0;
          });
        }
        return sortedArray;
      },
      _signature: [{ types: [TYPE_ARRAY3, TYPE_ARRAY_STRING3, TYPE_ARRAY_NUMBER2] }]
    },
    /**
     * Sort an array using an expression `expr` as the sort key. For each element
     * in the array of elements, the `expr` expression is applied and the resulting
     * value is used as the key used when sorting the elements. If the result of
     * evaluating the `expr` against the current array element results in type
     * other than a number or a string, a type error will occur.
     * @param {array} elements
     * @param {expression} expr
     * @return {array}
     * @function sortBy
     * @example
     * sortBy(['abcd', 'e', 'def'], &length(@)) //returns ['e', 'def', 'abcd']
     * @example
     * // returns [{year: 1910}, {year: 2010}, {year: 2020}]
     * sortBy([{year: 2010}, {year: 2020}, {year: 1910}], &year)
     * @category jmespath
     */
    sortBy: {
      _func: (resolvedArgs) => {
        const sortedArray = resolvedArgs[0].slice(0);
        if (sortedArray.length === 0) {
          return sortedArray;
        }
        const exprefNode = resolvedArgs[1];
        const requiredType = getTypeName2(
          runtime.interpreter.visit(exprefNode, sortedArray[0])
        );
        if ([TYPE_NUMBER2, TYPE_STRING3].indexOf(requiredType) < 0) {
          throw new Error("TypeError");
        }
        const decorated = [];
        for (let i = 0; i < sortedArray.length; i += 1) {
          decorated.push([i, sortedArray[i]]);
        }
        decorated.sort((a, b) => {
          const exprA = runtime.interpreter.visit(exprefNode, a[1]);
          const exprB = runtime.interpreter.visit(exprefNode, b[1]);
          if (getTypeName2(exprA) !== requiredType) {
            throw new Error(
              `TypeError: expected ${requiredType}, received ${getTypeName2(exprA)}`
            );
          } else if (getTypeName2(exprB) !== requiredType) {
            throw new Error(
              `TypeError: expected ${requiredType}, received ${getTypeName2(exprB)}`
            );
          }
          if (exprA > exprB) {
            return 1;
          }
          if (exprA < exprB) {
            return -1;
          }
          return a[0] - b[0];
        });
        for (let j = 0; j < decorated.length; j += 1) {
          [, sortedArray[j]] = decorated[j];
        }
        return sortedArray;
      },
      _signature: [{ types: [TYPE_ARRAY3] }, { types: [TYPE_EXPREF2] }]
    },
    /**
     * Returns true if the `subject` starts with the `prefix`, otherwise returns false.
     * @param {string} subject subject in which the `prefix` is being searched for
     * @param {string} prefix prefix to search in the subject
     * @return {boolean}
     * @function startsWith
     * @example
     * startsWith('jack is at home', 'jack') // returns true
     * @category jmespath
     */
    startsWith: {
      _func: (resolvedArgs) => valueOf(resolvedArgs[0]).startsWith(valueOf(resolvedArgs[1])),
      _signature: [{ types: [TYPE_STRING3] }, { types: [TYPE_STRING3] }]
    },
    /**
     * Returns the sum of the provided `collection` array argument.
     * An empty array will produce a return value of 0.
     * @param {number[]} collection array whose element's sum has to be computed
     * @return {number}
     * @function sum
     * @example
     * sum([1, 2, 3]) //returns 6
     * @category jmespath
     */
    sum: {
      _func: (resolvedArgs) => {
        let sum = 0;
        resolvedArgs[0].forEach((arg) => {
          sum += arg * 1;
        });
        return sum;
      },
      _signature: [{ types: [TYPE_ARRAY_NUMBER2] }]
    },
    /**
     * converts the passed `arg` to an array. The conversion happens as per the following rules
     * * array - Returns the passed in value.
     * * number/string/object/boolean - Returns a one element array containing the argument.
     * @param {any} arg
     * @return {array}
     * @function toArray
     * @example
     * toArray(1) // returns [1]
     * @example
     * toArray(null()) // returns [`null`]
     * @category jmespath
     */
    toArray: {
      _func: (resolvedArgs) => {
        if (getTypeName2(resolvedArgs[0]) === TYPE_ARRAY3) {
          return resolvedArgs[0];
        }
        return [resolvedArgs[0]];
      },
      _signature: [{ types: [TYPE_ANY3] }]
    },
    /**
     * converts the passed arg to a number. The conversion happens as per the following rules
     * * string - Returns the parsed number.
     * * number - Returns the passed in value.
     * * array - null
     * * object - null
     * * boolean - null
     * * null - null
     * @param {any} arg
     * @return {number}
     * @function toNumber
     * @example
     * toNumber(1) //returns 1
     * @example
     * toNumber('10') //returns 10
     * @example
     * toNumber({a: 1}) //returns null
     * @example
     * toNumber(true()) //returns null
     * @category jmespath
     */
    toNumber: {
      _func: (resolvedArgs) => {
        const typeName = getTypeName2(resolvedArgs[0]);
        if (typeName === TYPE_NUMBER2) {
          return resolvedArgs[0];
        }
        if (typeName === TYPE_STRING3) {
          return toNumber(resolvedArgs[0]);
        }
        return null;
      },
      _signature: [{ types: [TYPE_ANY3] }]
    },
    /**
     * converts the passed `arg` to a string. The conversion happens as per the following rules
     * * string - Returns the passed in value.
     * * number/array/object/boolean - The JSON encoded value of the object.
     * @param {any} arg
     * @return {string}
     * @function toString
     * @example
     * toString(1) //returns '1'
     * @example
     * toString(true()) //returns 'true'
     * @category jmespath
     */
    toString: {
      _func: (resolvedArgs) => {
        if (getTypeName2(resolvedArgs[0]) === TYPE_STRING3) {
          return resolvedArgs[0];
        }
        return JSON.stringify(resolvedArgs[0]);
      },
      _signature: [{ types: [TYPE_ANY3] }]
    },
    /**
     * Returns the JavaScript type of the given `subject` argument as a string value.
     *
     * The return value MUST be one of the following:
     * * number
     * * string
     * * boolean
     * * array
     * * object
     * * null
     * @param {any} subject
     * @return {string}
     *
     * @function type
     * @example
     * type(1) //returns 'number'
     * @example
     * type('') //returns 'string'
     * @category jmespath
     */
    type: {
      _func: (resolvedArgs) => ({
        [TYPE_NUMBER2]: "number",
        [TYPE_STRING3]: "string",
        [TYPE_ARRAY3]: "array",
        [TYPE_OBJECT2]: "object",
        [TYPE_BOOLEAN2]: "boolean",
        [TYPE_EXPREF2]: "expref",
        [TYPE_NULL2]: "null"
      })[getTypeName2(resolvedArgs[0])],
      _signature: [{ types: [TYPE_ANY3] }]
    },
    /**
     * Returns the values of the provided object `obj`. Note that because JSON hashes are
     * inherently unordered, the values associated with the provided object obj are
     * inherently unordered.
     * @param {object} obj
     * @return {array}
     * @function values
     * @example
     * values({a : 3, b : 4}) //returns [3, 4]
     * @category jmespath
     */
    values: {
      _func: (resolvedArgs) => {
        const arg = valueOf(resolvedArgs[0]);
        if (arg === null) return [];
        return Object.values(arg);
      },
      _signature: [{ types: [TYPE_ANY3] }]
    },
    /**
     * Returns a convolved (zipped) array containing grouped arrays of values from
     * the array arguments from index 0, 1, 2, etc.
     * This function accepts a variable number of arguments.
     * The length of the returned array is equal to the length of the shortest array.
     * @param {...array} arrays array of arrays to zip together
     * @return {array} An array of arrays with elements zipped together
     * @function zip
     * @example
     * zip([1, 2, 3], [4, 5, 6]) //returns [[1, 4], [2, 5], [3, 6]]
     * @category jmespath
     */
    zip: {
      _func: (args) => {
        const count = args.reduce((min, current) => Math.min(min, current.length), args[0].length);
        const result = new Array(count);
        for (let i = 0; i < count; i += 1) {
          result[i] = [];
          args.forEach((a) => {
            result[i].push(a[i]);
          });
        }
        return result;
      },
      _signature: [{ types: [TYPE_ARRAY3], variadic: true }]
    }
  };
  return functionMap;
}

// node_modules/@adobe/json-formula/src/jmespath/jmespath.js
var {
  TYPE_CLASS: TYPE_CLASS2,
  TYPE_ANY: TYPE_ANY2
} = dataTypes_default;
function getToNumber(stringToNumber, debug = []) {
  return (value) => {
    const n = getValueOf(value);
    if (n === null) return null;
    if (n instanceof Array) {
      debug.push("Converted array to zero");
      return 0;
    }
    const type = typeof n;
    if (type === "number") return n;
    if (type === "string") return stringToNumber(n, debug);
    if (type === "boolean") return n ? 1 : 0;
    debug.push("Converted object to zero");
    return 0;
  };
}
function toString(a) {
  if (a === null || a === void 0) return "";
  return a.toString();
}
var defaultStringToNumber = (str) => {
  const n = +str;
  return Number.isNaN(n) ? 0 : n;
};
function isClass(obj) {
  if (obj === null) return false;
  if (Array.isArray(obj)) return false;
  return obj.constructor.name !== "Object";
}
function matchClass(arg, expectedList) {
  return expectedList.includes(TYPE_CLASS2) && isClass(arg);
}
var Runtime = class {
  constructor(debug, toNumber, customFunctions = {}) {
    this.strictDeepEqual = strictDeepEqual;
    this.toNumber = toNumber;
    this.functionTable = functions(
      this,
      isObject,
      isArray,
      toNumber,
      getTypeName,
      getValueOf,
      toString,
      debug
    );
    Object.entries(
      openFormulaFunctions(getValueOf, toString, toNumber, debug)
    ).forEach(([fname, func]) => {
      this.functionTable[fname] = func;
    });
    Object.entries(customFunctions).forEach(([fname, func]) => {
      func._runtime = this;
      this.functionTable[fname] = func;
    });
  }
  // eslint-disable-next-line class-methods-use-this
  _validateArgs(argName, args, signature, bResolved) {
    if (signature.length === 0 && args.length > 0) {
      throw new Error(`ArgumentError: ${argName}() does not accept parameters`);
    }
    if (signature.length === 0) {
      return;
    }
    let pluralized;
    const argsNeeded = signature.filter((arg) => !arg.optional).length;
    if (signature[signature.length - 1].variadic) {
      if (args.length < signature.length) {
        pluralized = signature.length === 1 ? " argument" : " arguments";
        throw new Error(`ArgumentError: ${argName}() takes at least${signature.length}${pluralized} but received ${args.length}`);
      }
    } else if (args.length < argsNeeded || args.length > signature.length) {
      pluralized = signature.length === 1 ? " argument" : " arguments";
      throw new Error(`ArgumentError: ${argName}() takes ${signature.length}${pluralized} but received ${args.length}`);
    }
    if (!bResolved) return;
    let currentSpec;
    let actualType;
    const limit = Math.min(signature.length, args.length);
    for (let i = 0; i < limit; i += 1) {
      currentSpec = signature[i].types;
      if (!matchClass(args[i], currentSpec) && !currentSpec.includes(TYPE_ANY2)) {
        actualType = getTypeNames(args[i]);
        args[i] = matchType(actualType, currentSpec, args[i], argName, this.toNumber, toString);
      }
    }
  }
  callFunction(name, resolvedArgs, data, interpreter, bResolved = true) {
    if (!Object.prototype.hasOwnProperty.call(this.functionTable, name)) throw new Error(`Unknown function: ${name}()`);
    const functionEntry = this.functionTable[name];
    this._validateArgs(name, resolvedArgs, functionEntry._signature, bResolved);
    return functionEntry._func.call(this, resolvedArgs, data, interpreter);
  }
};
var Formula = class {
  constructor(debug, customFunctions, stringToNumberFn) {
    this.debug = debug;
    this.toNumber = getToNumber(stringToNumberFn || defaultStringToNumber, debug);
    this.runtime = new Runtime(debug, this.toNumber, customFunctions);
  }
  compile(stream, allowedGlobalNames = []) {
    let ast;
    try {
      const parser = new Parser(allowedGlobalNames);
      ast = parser.parse(stream, this.debug);
    } catch (e) {
      this.debug.push(e.toString());
      throw e;
    }
    return ast;
  }
  search(node, data, globals = {}, language = "en-US") {
    this.runtime.interpreter = new TreeInterpreter(
      this.runtime,
      globals,
      this.toNumber,
      toString,
      this.debug,
      language
    );
    try {
      return this.runtime.interpreter.search(node, data);
    } catch (e) {
      this.debug.push(e.message || e.toString());
      throw e;
    }
  }
};

// node_modules/@adobe/json-formula/src/json-formula.js
var JsonFormula = class {
  /**
   * @param customFunctions {*} custom functions needed by a hosting application.
   * @param stringToNumber {function} A function that converts string values to numbers.
   * Can be used to convert currencies/dates to numbers
   * @param language
   * @param debug {array} will be populated with any errors/warnings
   */
  constructor(customFunctions = {}, stringToNumber = null, debug = []) {
    this.customFunctions = { ...customFunctions };
    this.stringToNumber = stringToNumber;
    this.debug = debug;
    this.formula = new Formula(debug, customFunctions, stringToNumber);
  }
  /**
   * Evaluates the JsonFormula on a particular json payload and return the result
   * @param json {object} the json data on which the expression needs to be evaluated
   * @param globals {*} global objects that can be accessed via custom functions.
   * @returns {*} the result of the expression being evaluated
   */
  search(expression, json, globals = {}, language = "en-US") {
    const ast = this.compile(expression, Object.keys(globals));
    return this.run(ast, json, language, globals);
  }
  /**
   * Execute a previously compiled expression against a json object and return the result
   * @param ast {object} The abstract syntax tree returned from compile()
   * @param json {object} the json data on which the expression needs to be evaluated
   * @param globals {*} set of objects available in global scope
   * @returns {*} the result of the expression being evaluated
   */
  run(ast, json, language, globals) {
    return this.formula.search(
      ast,
      json,
      globals,
      language
    );
  }
  /*
   * Creates a compiled expression that can be executed later on with some data.
   * @param expression {string} the expression to evaluate
   * @param allowedGlobalNames {string[]} A list of names of the global variables
   * being used in the expression.
   * @param debug {array} will be populated with any errors/warnings
   */
  compile(expression, allowedGlobalNames = []) {
    this.debug.length = 0;
    return this.formula.compile(expression, allowedGlobalNames);
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/models/BaseModel.js
var BaseModel = class {
  constructor(json, nodeName) {
    this.json = json;
    this.nodeName = nodeName || json.nodeName;
    this.items = json.items || [];
  }
  accept(visitor) {
    return visitor.visit(this);
  }
  get(index) {
    return this.items[index];
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/models/TerminalModel.js
var TerminalModel = class extends BaseModel {
  constructor(json, nodeName) {
    super(json, nodeName);
    this.value = json.value;
    if (json.properties) {
      this.properties = json.properties;
    } else if (json.value && typeof json.value === "object" && !Array.isArray(json.value)) {
      this.properties = json.value;
    } else {
      this.properties = {};
    }
  }
  getValue() {
    return this.value;
  }
  getProperty(key) {
    return this.properties[key];
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/models/ChoiceModel.js
var ChoiceModel = class extends BaseModel {
  constructor(json, nodeName) {
    super(json, nodeName);
    this.choice = json.choice || null;
  }
  /**
   * Get the selected choice model
   * @returns {Object|null}
   */
  getChoice() {
    return this.choice;
  }
  /**
   * Set the selected choice model
   * @param {Object} model
   */
  setChoice(model) {
    this.choice = model;
  }
  /**
   * Accept visitor pattern
   * @param {Object} visitor
   */
  accept(visitor) {
    const enterMethod = `enter${this.nodeName}`;
    const exitMethod = `exit${this.nodeName}`;
    let skipChildren = false;
    if (visitor[enterMethod]) {
      skipChildren = visitor[enterMethod](this) === false;
    }
    if (!skipChildren && this.choice) {
      this.choice.accept(visitor);
    }
    if (visitor[exitMethod]) {
      visitor[exitMethod](this);
    }
  }
  /**
   * Get child at index (for compatibility)
   * @param {number} index
   * @returns {Object|null}
   */
  get(index) {
    return index === 0 ? this.choice : null;
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/models/SequenceModel.js
var SequenceModel = class extends BaseModel {
  constructor(json, nodeName) {
    super(json, nodeName);
    this.items = json.items || [];
  }
  /**
   * Get child at index
   * @param {number} index
   * @returns {Object|null}
   */
  get(index) {
    return this.items[index] || null;
  }
  /**
   * Set child at index
   * @param {number} index
   * @param {Object} model
   */
  set(index, model) {
    this.items[index] = model;
  }
  /**
   * Get number of children
   * @returns {number}
   */
  size() {
    return this.items.length;
  }
  /**
   * Accept visitor pattern
   * @param {Object} visitor
   */
  accept(visitor) {
    const enterMethod = `enter${this.nodeName}`;
    const exitMethod = `exit${this.nodeName}`;
    let skipChildren = false;
    if (visitor[enterMethod]) {
      skipChildren = visitor[enterMethod](this) === false;
    }
    if (!skipChildren) {
      this.items.forEach((item) => {
        if (item) {
          item.accept(visitor);
        }
      });
    }
    if (visitor[exitMethod]) {
      visitor[exitMethod](this);
    }
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/models/ListModel.js
var ListModel = class extends BaseModel {
  constructor(json, nodeName) {
    super(json, nodeName);
    this.items = json.items || [];
  }
  /**
   * Add item to list
   * @param {Object} model
   */
  add(model) {
    this.items.push(model);
  }
  /**
   * Remove item at index
   * @param {number} index
   */
  remove(index) {
    this.items.splice(index, 1);
  }
  /**
   * Move item from index to newIndex
   * @param {number} index
   * @param {number} newIndex
   */
  move(index, newIndex) {
    this.items.splice(newIndex, 0, this.items.splice(index, 1)[0]);
  }
  /**
   * Get item at index
   * @param {number} index
   * @returns {Object|null}
   */
  get(index) {
    return this.items[index] || null;
  }
  /**
   * Set item at index
   * @param {number} index
   * @param {Object} model
   */
  set(index, model) {
    if (index > -1 && index < this.items.length) {
      this.items[index] = model;
    }
  }
  /**
   * Get number of items
   * @returns {number}
   */
  size() {
    return this.items.length;
  }
  /**
   * Clear all items
   */
  clear() {
    this.items = [];
  }
  /**
   * Accept visitor pattern
   * @param {Object} visitor
   */
  accept(visitor) {
    const enterMethod = `enter${this.nodeName}`;
    const exitMethod = `exit${this.nodeName}`;
    let skipChildren = false;
    if (visitor[enterMethod]) {
      skipChildren = visitor[enterMethod](this) === false;
    }
    if (!skipChildren) {
      this.items.forEach((item) => {
        if (item) {
          item.accept(visitor);
        }
      });
    }
    if (visitor[exitMethod]) {
      visitor[exitMethod](this);
    }
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/grammar/GrammarConfig.js
var OperatorGroups = {
  // Arithmetic operators for mathematical calculations
  ARITHMETIC: ["PLUS", "MINUS", "MULTIPLY", "DIVIDE"],
  // String concatenation
  STRING: ["CONCAT"],
  // Numeric and value comparison
  COMPARISON: [
    "EQUALS_TO",
    "NOT_EQUALS_TO",
    "GREATER_THAN",
    "LESS_THAN",
    "GREATER_THAN_EQUAL",
    "LESS_THAN_EQUAL"
  ],
  // String-specific comparison (function-based)
  STRING_COMPARISON: [
    "CONTAINS",
    "STARTS_WITH",
    "ENDS_WITH",
    "DOES_NOT_CONTAIN"
  ],
  // Unary operators (single operand)
  UNARY: [
    "IS_EMPTY",
    "IS_NOT_EMPTY",
    "IS_TRUE",
    "IS_FALSE"
  ],
  // Logical operators for boolean combination
  LOGICAL: ["AND", "OR"]
};
var GrammarConfig = {
  // Root
  ROOT: {
    rule: "STATEMENT"
  },
  STATEMENT: {
    rule: "EVENT_SCRIPTS | CALC_EXPRESSION | FORMAT_EXPRESSION | VALIDATE_EXPRESSION | CLEAR_EXPRESSION | VISIBLE_EXPRESSION | SHOW_EXPRESSION | ACCESS_EXPRESSION | DISABLE_EXPRESSION"
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
    rule: "is changed | is clicked | is initialized | EQUALS_TO | NOT_EQUALS_TO | GREATER_THAN | LESS_THAN | HAS_SELECTED"
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
    rule: "HIDE_STATEMENT | SHOW_STATEMENT | ENABLE_STATEMENT | DISABLE_STATEMENT | SET_VALUE_STATEMENT | WSDL_STATEMENT | SET_PROPERTY | CLEAR_VALUE_STATEMENT | SET_FOCUS | SUBMIT_FORM | RESET_FORM | VALIDATE_FORM | ADD_INSTANCE | REMOVE_INSTANCE | FUNCTION_CALL | DISPATCH_EVENT | NAVIGATE_TO"
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
    rule: "NEW_WINDOW | NEW_TAB | SAME_PAGE"
  },
  NAVIGATE_IN_PANEL: {
    rule: "PANEL_FOCUS_OPTION of PANEL"
  },
  PANEL_FOCUS_OPTION: {
    rule: "NEXT_ITEM | PREVIOUS_ITEM"
  },
  // Expressions
  EXPRESSION: {
    rule: "COMPONENT | STRING_LITERAL | NUMERIC_LITERAL | FUNCTION_CALL | BINARY_EXPRESSION | COMPARISON_EXPRESSION | MEMBER_EXPRESSION"
  },
  EXTENDED_EXPRESSION: {
    rule: "COMPONENT | STRING_LITERAL | NUMERIC_LITERAL | FUNCTION_CALL | BINARY_EXPRESSION | MEMBER_EXPRESSION"
  },
  PRIMITIVE_EXPRESSION: {
    rule: "STRING_LITERAL | NUMERIC_LITERAL | BOOLEAN_LITERAL"
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
  }
  // Component model (special terminal with metadata)
  // COMPONENT: {
  //   model: 'ComponentModel',
  // },
};
var getRule = (nodeName, toggleProvider) => {
  const config = GrammarConfig[nodeName];
  if (config?.ftRule) {
    for (const [ft, ftConfig] of Object.entries(config.ftRule)) {
      if (toggleProvider?.isEnabled?.(ft)) {
        return typeof ftConfig === "string" ? ftConfig : ftConfig.rule;
      }
    }
  }
  return config?.rule;
};
var isFtBaseAllowed = (nodeName, toggleProvider) => {
  const config = GrammarConfig[nodeName];
  if (config?.ftRule) {
    for (const [ft, ftConfig] of Object.entries(config.ftRule)) {
      if (toggleProvider?.isEnabled?.(ft)) {
        return typeof ftConfig === "object" && ftConfig.allowBase === true;
      }
    }
  }
  return false;
};

// node_modules/@aemforms/rule-editor-transformer/src/models/ModelFactory.js
var MODEL_CONSTRUCTORS = {
  BaseModel,
  ChoiceModel,
  SequenceModel,
  ListModel,
  TerminalModel,
  RootModel: BaseModel,
  CalcExpressionModel: BaseModel,
  ComponentModel: TerminalModel,
  ExpressionModel: BaseModel
};
var ModelFactory = class {
  /**
   * Determine model type from grammar rule pattern
   * @param {string} rule - The grammar rule
   * @returns {string} - Model name
   */
  static getModelTypeFromRule(rule) {
    if (!rule || typeof rule !== "string") {
      return "TerminalModel";
    }
    if (rule.includes("|")) {
      return "ChoiceModel";
    }
    if (rule.endsWith("+") || rule.endsWith("*")) {
      return "ListModel";
    }
    if (rule === "VARIABLE" || rule === "") {
      return "TerminalModel";
    }
    return "SequenceModel";
  }
  static createModel(json) {
    if (!json || !json.nodeName) {
      return null;
    }
    const { nodeName } = json;
    const grammarEntry = GrammarConfig[nodeName];
    let modelName;
    if (grammarEntry?.model) {
      modelName = grammarEntry.model;
    } else if (grammarEntry?.rule) {
      modelName = this.getModelTypeFromRule(grammarEntry.rule);
    } else {
      modelName = "TerminalModel";
    }
    const ModelConstructor = MODEL_CONSTRUCTORS[modelName] || BaseModel;
    const model = new ModelConstructor(json, nodeName);
    if (json.choice) {
      model.choice = this.createModel(json.choice);
    }
    if (json.items && Array.isArray(json.items)) {
      model.items = json.items.map((item) => this.createModel(item));
    }
    return model;
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/transformers/BaseTransformer.js
var BaseTransformer = class {
  constructor(scope) {
    this.scope = scope;
  }
  /**
   * Visit a model node
   */
  visit(model) {
    if (!model) {
      return "";
    }
    const { nodeName } = model;
    const methodName = `enter${nodeName}`;
    if (typeof this[methodName] === "function") {
      return this[methodName](model);
    }
    if (model.choice) {
      return this.visit(model.choice);
    }
    if (model.items && model.items.length > 0) {
      return model.items.map((item) => this.visit(item)).join("");
    }
    return "";
  }
  /**
   * Transform a model tree
   */
  transform(model) {
    return this.visit(model);
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/transformers/JsonFormulaTransformer.js
var PRIMITIVE_TYPES = /* @__PURE__ */ new Set(["STRING", "NUMBER", "DATE", "BOOLEAN", "BINARY"]);
var wsdlCallSeq = 0;
var JsonFormulaTransformer = class _JsonFormulaTransformer extends BaseTransformer {
  constructor(scope, toggleProvider) {
    super(scope);
    this.toggleProvider = toggleProvider ?? new StaticToggleProvider(DEFAULT_TOGGLES);
    this.result = {
      script: {
        content: ""
      }
    };
    this.currentRuleType = null;
    this.eventCondition = null;
    this.eventSourceComponentId = null;
    this.componentActions = /* @__PURE__ */ new Map();
    this.inFunctionCall = false;
    this.inFunctionCallAsObject = false;
    this.inBinaryCondition = false;
    this.otherEvents = {};
    this.currentEvent = {
      field: null,
      name: null,
      model: null,
      otherEvents: null
    };
  }
  /**
   * Transform and return result in single-rule format
   * @returns {{ field, event, model, content, otherEvents }}
   */
  transform(model) {
    const script = this.visit(model);
    if (!Array.isArray(this.result.script.content)) {
      this.result.script.content = script;
    }
    return {
      field: this.currentEvent.field,
      event: this.currentEvent.name || this.eventType || null,
      model: null,
      content: this.result.script.content,
      otherEvents: this.result.otherEvents || null
    };
  }
  /**
   * Returns the relative name of fieldToCheck with respect to currentField.
   */
  static getRelativeName(fieldToCheck, currentField) {
    if (!fieldToCheck) {
      return "";
    }
    if (fieldToCheck === currentField) {
      return "$field";
    }
    const parentOfField = fieldToCheck.split(".").slice(0, -1).join(".");
    if (parentOfField.startsWith(currentField)) {
      return fieldToCheck.substring(currentField.length + 1);
    }
    const parentOfCurrentField = currentField.split(".").slice(0, -1).join(".");
    if (parentOfCurrentField === parentOfField) {
      return fieldToCheck.split(".").slice(-1)[0];
    }
    return fieldToCheck;
  }
  /**
   * Handle ROOT node
   */
  enterROOT(model) {
    if (model.items && model.items.length > 0) {
      return this.visit(model.items[0]);
    }
    return "";
  }
  /**
   * Handle CALC_EXPRESSION node
   */
  enterCALC_EXPRESSION(model) {
    const valueExpression = model.items[2];
    const conditionOrAlways = model.items[4];
    if (model.items[0] && model.items[0].properties && model.items[0].properties.id) {
      this.currentEvent.field = model.items[0].properties.id;
    } else if (this.eventSourceComponentId) {
      this.currentEvent.field = this.eventSourceComponentId;
    }
    const valueScript = this.visit(valueExpression);
    const conditionChild = conditionOrAlways?.choice;
    let finalScript;
    if (conditionChild) {
      const conditionScript = this.visit(conditionChild);
      finalScript = `if(${conditionScript},${valueScript},$field)`;
    } else {
      finalScript = valueScript;
    }
    this.result.rules = {
      value: finalScript,
      validationStatus: "valid"
    };
    return finalScript;
  }
  /**
   * Handle EXPRESSION node
   */
  enterEXPRESSION(model) {
    if (model.choice) {
      return this.visit(model.choice);
    }
    return "";
  }
  /**
   * Handle BOOLEAN_LITERAL node
   */
  enterBOOLEAN_LITERAL(model) {
    if (model.choice) {
      return this.visit(model.choice);
    }
    return "";
  }
  /**
   * Handle False node
   */
  // eslint-disable-next-line class-methods-use-this
  enterFalse(_) {
    return "false()";
  }
  /**
   * Handle True node
   */
  // eslint-disable-next-line class-methods-use-this
  enterTrue(_) {
    return "true()";
  }
  /**
   * Handle COMPONENT node
   */
  enterCOMPONENT(model) {
    const id = model.getProperty?.("id") ?? model.value?.id;
    if (!id) {
      return "";
    }
    if (id === "$globalForm" && this.inFunctionCall) {
      return "undefined";
    }
    let componentName;
    const refField = this.currentEvent.field || this.eventSourceComponentId;
    if (refField) {
      componentName = _JsonFormulaTransformer.getRelativeName(id, refField);
    } else {
      const parts = id.split(".");
      componentName = parts[parts.length - 1];
    }
    const type = model.getProperty?.("type") ?? model.value?.type;
    const firstType = type ? type.split("|")[0].trim() : "";
    const primitive = type && PRIMITIVE_TYPES.has(firstType);
    if (primitive && !this.inFunctionCallAsObject) {
      return `${componentName}.$value`;
    }
    return componentName;
  }
  /**
   * Handle AFCOMPONENT node (Adaptive Form component)
   */
  enterAFCOMPONENT(model) {
    const id = model.getProperty?.("id") || model.value?.id;
    if (!id) {
      return "";
    }
    const refField = this.currentEvent.field || this.eventSourceComponentId;
    if (refField) {
      return _JsonFormulaTransformer.getRelativeName(id, refField);
    }
    return id.split(".").pop();
  }
  /**
   * Handle STRING_LITERAL node
   */
  // eslint-disable-next-line class-methods-use-this
  enterSTRING_LITERAL(model) {
    const value = model.getValue ? model.getValue() : model.value;
    if (value === null) {
      return void 0;
    }
    return `'${value}'`;
  }
  /**
   * Handle DATE_LITERAL node
   */
  // eslint-disable-next-line class-methods-use-this
  enterDATE_LITERAL(model) {
    const value = model.getValue ? model.getValue() : model.value;
    return `'${value}'`;
  }
  /**
   * Handle URL_LITERAL node
   */
  // eslint-disable-next-line class-methods-use-this
  enterURL_LITERAL(model) {
    const value = model.getValue ? model.getValue() : model.value;
    return `'${value}'`;
  }
  /**
   * Handle URL_DETAILS node — generates getURLDetail('detail')
   */
  // eslint-disable-next-line class-methods-use-this
  enterURL_DETAILS(model) {
    const value = model.getValue ? model.getValue() : model.value;
    return `getURLDetail('${value}')`;
  }
  /**
   * Handle UTM_PARAMETER node — generates getQueryParameter('paramName')
   */
  // eslint-disable-next-line class-methods-use-this
  enterUTM_PARAMETER(model) {
    const value = model.getValue ? model.getValue() : model.value;
    return `getQueryParameter('${value}')`;
  }
  /**
   * Handle QUERY_PARAMETER node — generates getQueryParameter('paramName')
   */
  // eslint-disable-next-line class-methods-use-this
  enterQUERY_PARAMETER(model) {
    const value = model.getValue ? model.getValue() : model.value;
    return `getQueryParameter('${value}')`;
  }
  // eslint-disable-next-line class-methods-use-this
  enterBROWSER_DETAILS(model) {
    const value = model.getValue ? model.getValue() : model.value;
    return `getBrowserDetail('${value}')`;
  }
  enterEVENT_PAYLOAD(model) {
    const value = model.getValue ? model.getValue() : model.value;
    const sep = value && value.startsWith("[") ? "" : ".";
    if (this._encryptedCallback) {
      return `toObject($event.payload)${sep}${value}`;
    }
    return `toObject($event.payload.body)${sep}${value}`;
  }
  /**
   * Handle NAVIGATE_TO_EXPRESSION node
   */
  enterNAVIGATE_TO_EXPRESSION(model) {
    if (model.choice) {
      return this.visit(model.choice);
    }
    if (model.items && model.items.length > 0) {
      return this.visit(model.items[0]);
    }
    return "";
  }
  /**
   * Handle COMPARISON_EXPRESSION node
   */
  enterCOMPARISON_EXPRESSION(model) {
    const operatorNode = model.items[1];
    const operatorName = operatorNode.choice?.nodeName || operatorNode.nodeName;
    const left = this.visit(model.items[0]);
    if (operatorName === "IS_NOT_EMPTY") {
      return `!(!(${left}))`;
    }
    if (operatorName === "IS_EMPTY") {
      return `!(${left})`;
    }
    if (operatorName === "IS_TRUE") {
      return `${left} == true() `;
    }
    if (operatorName === "IS_FALSE") {
      return `${left} == false() `;
    }
    if (operatorName === "CONTAINS") {
      const right2 = this.visit(model.items[2]);
      return `contains(${left}, ${right2})`;
    }
    if (operatorName === "STARTS_WITH") {
      const right2 = this.visit(model.items[2]);
      return `startsWith(${left}, ${right2})`;
    }
    if (operatorName === "ENDS_WITH") {
      const right2 = this.visit(model.items[2]);
      return `endsWith(${left}, ${right2})`;
    }
    if (operatorName === "DOES_NOT_CONTAIN") {
      const right2 = this.visit(model.items[2]);
      return `!contains(${left}, ${right2})`;
    }
    const right = this.visit(model.items[2]);
    const operator = this.visit(operatorNode);
    return `${left} ${operator} ${right}`;
  }
  /**
   * Handle CONDITION node — wraps result in parens if nested=true
   */
  enterCONDITION(model) {
    let result;
    if (model.choice) {
      result = this.visit(model.choice);
    } else if (model.items && model.items.length > 0) {
      result = this.visit(model.items[0]);
    } else {
      result = "";
    }
    return model.json?.nested ? `(${result})` : result;
  }
  /**
   * Handle BOOLEAN_BINARY_EXPRESSION node — flat list of CONDITIONs and OPERATORs
   */
  enterBOOLEAN_BINARY_EXPRESSION(model) {
    if (!model.items) {
      return "";
    }
    return model.items.map((item) => this.visit(item)).join(" ");
  }
  /**
   * Handle ACCESS_EXPRESSION node (fd:enabled / fd:visible rules)
   * Structure: AFCOMPONENT, When, CONDITIONORALWAYS
   */
  enterACCESS_EXPRESSION(model) {
    const component = model.items?.[0];
    const componentId = component?.value?.id || component?.properties?.id;
    if (componentId) {
      this.currentEvent.field = componentId;
    }
    const conditionOrAlways = model.items?.[2];
    return conditionOrAlways ? this.visit(conditionOrAlways) : "";
  }
  /**
   * Handle SHOW_EXPRESSION / HIDE_EXPRESSION / ENABLE_EXPRESSION / DISABLE_EXPRESSION
   * Structure: AFCOMPONENT, When, CONDITIONORALWAYS[, Else, DONOTHING_OR_*]
   * SHOW/ENABLE → return condition as-is
   * HIDE/DISABLE → return !(condition)
   */
  _enterVisibilityExpression(model, negate) {
    const component = model.items?.[0];
    const componentId = component?.value?.id || component?.properties?.id;
    if (componentId) {
      this.currentEvent.field = componentId;
    }
    const conditionOrAlways = model.items?.[2];
    const hasCondition = conditionOrAlways?.choice != null;
    if (!hasCondition) {
      return negate ? "false()" : "true()";
    }
    const condition = this.visit(conditionOrAlways);
    return negate ? `!(${condition})` : condition;
  }
  enterSHOW_EXPRESSION(model) {
    return this._enterVisibilityExpression(model, false);
  }
  enterHIDE_EXPRESSION(model) {
    return this._enterVisibilityExpression(model, true);
  }
  enterENABLE_EXPRESSION(model) {
    return this._enterVisibilityExpression(model, false);
  }
  enterDISABLE_EXPRESSION(model) {
    return this._enterVisibilityExpression(model, true);
  }
  enterVISIBLE_EXPRESSION(model) {
    return this._enterVisibilityExpression(model, true);
  }
  /**
   * Handle TRIGGER_SCRIPTS node
   * Structure: SINGLE_TRIGGER_SCRIPTS[]
   *   SINGLE_TRIGGER_SCRIPTS: [COMPONENT, TRIGGER_EVENT, When, TRIGGER_EVENT_SCRIPTS]
   *   TRIGGER_EVENT_SCRIPTS: [CONDITION, Then, BLOCK_STATEMENTS]
   */
  enterTRIGGER_SCRIPTS(model) {
    const scripts = [];
    (model.items || []).forEach((singleTrigger) => {
      if (!singleTrigger || singleTrigger.nodeName !== "SINGLE_TRIGGER_SCRIPTS") {
        return;
      }
      const component = singleTrigger.items?.[0];
      const componentId = component?.value?.id || component?.properties?.id;
      if (componentId) {
        this.currentEvent.field = componentId;
        this.eventSourceComponentId = componentId;
      }
      const triggerEventScripts = singleTrigger.items?.[3];
      if (!triggerEventScripts) {
        return;
      }
      const conditionNode = triggerEventScripts.items?.[0];
      const blockStatements = triggerEventScripts.items?.[2];
      const conditionScript = conditionNode && conditionNode.choice ? this.visit(conditionNode) : null;
      this.componentActions.clear();
      if (blockStatements && blockStatements.items) {
        blockStatements.items.forEach((stmt) => this.processBlockStatement(stmt));
      }
      this.componentActions.forEach((actions, comp) => {
        if (comp === "__global__") {
          actions.forEach((action) => {
            const script = this.generateGlobalActionScript(action);
            scripts.push(conditionScript ? `if(${conditionScript}, ${script}, {})` : script);
          });
        } else {
          const baseScript = this.generateActionScript(comp, actions);
          if (baseScript !== null) {
            scripts.push(conditionScript ? `if(${conditionScript}, ${baseScript}, {})` : baseScript);
          }
        }
      });
      const elseBlockStatements = triggerEventScripts.items?.length >= 5 ? triggerEventScripts.items[4] : null;
      if (elseBlockStatements && conditionScript) {
        const elseCondition = `!(${conditionScript})`;
        this.componentActions.clear();
        if (elseBlockStatements.items) {
          elseBlockStatements.items.forEach((stmt) => this.processBlockStatement(stmt));
        }
        this.componentActions.forEach((actions, comp) => {
          if (comp === "__global__") {
            actions.forEach((action) => {
              const script = this.generateGlobalActionScript(action);
              scripts.push(`if(${elseCondition}, ${script}, {})`);
            });
          } else {
            const baseScript = this.generateActionScript(comp, actions);
            if (baseScript !== null) {
              scripts.push(`if(${elseCondition}, ${baseScript}, {})`);
            }
          }
        });
      }
    });
    this.result.script.content = scripts;
    if (Object.keys(this.otherEvents).length > 0) {
      this.result.otherEvents = this.otherEvents;
    }
    return "";
  }
  /**
   * Handle EQUALS_TO operator
   */
  // eslint-disable-next-line class-methods-use-this
  enterEQUALS_TO(_) {
    return "==";
  }
  // eslint-disable-next-line class-methods-use-this
  enterNOT_EQUALS_TO(_) {
    return "!=";
  }
  // eslint-disable-next-line class-methods-use-this
  enterGREATER_THAN(_) {
    return ">";
  }
  // eslint-disable-next-line class-methods-use-this
  enterLESS_THAN(_) {
    return "<";
  }
  // eslint-disable-next-line class-methods-use-this
  enterGREATER_THAN_EQUAL(_) {
    return ">=";
  }
  // eslint-disable-next-line class-methods-use-this
  enterLESS_THAN_EQUAL(_) {
    return "<=";
  }
  /**
   * Handle EVENT_SCRIPTS node
   * Supports both new format (items: [EVENT_CONDITION, Then, BLOCK_STATEMENTS])
   * and legacy format (choice.items: [IF, EVENT_CONDITION, THEN, BLOCK_STATEMENTS])
   */
  enterEVENT_SCRIPTS(model) {
    if (!model.items || model.items.length < 3) {
      return "";
    }
    const eventConditionNode = model.items[0];
    const blockStatements = model.items[2];
    this.eventType = this.determineEventType(eventConditionNode);
    const eventNameMap = {
      click: "Click",
      change: "Value Commit",
      initialize: "Initialize"
    };
    this.currentEvent.name = eventNameMap[this.eventType] || this.eventType;
    this.eventCondition = this.extractEventCondition(eventConditionNode);
    this.currentEvent.field = this.eventSourceComponentId;
    const changeWrapper = "contains($event.payload.changes[].propertyName, 'value')";
    const changeWrapperPrefix = `(${changeWrapper} && `;
    if (this.eventType === "change" && this.eventCondition?.startsWith(changeWrapperPrefix)) {
      this.eventCondition = this.eventCondition.slice(changeWrapperPrefix.length, -1);
    }
    this.componentActions.clear();
    if (blockStatements && blockStatements.items) {
      blockStatements.items.forEach((stmt) => {
        this.processBlockStatement(stmt);
      });
    }
    const scripts = [];
    const mergedScripts = [];
    const isChangeEvent = this.eventType === "change";
    const hasNoCondition = this.eventCondition === "__NO_CONDITION__";
    const hasBinaryCondition = isChangeEvent && this.eventCondition && this.eventCondition !== changeWrapper && !hasNoCondition;
    const wrapWithConditions = (baseScript) => {
      if (hasNoCondition) {
        return baseScript;
      }
      if (isChangeEvent) {
        const innerScript = hasBinaryCondition ? `if(${this.eventCondition}, ${baseScript}, {})` : baseScript;
        return { unwrapped: innerScript, wrapped: `if(${changeWrapper}, ${innerScript}, {})` };
      }
      return { wrapped: `if(${this.eventCondition}, ${baseScript}, {})` };
    };
    const applyCondition = (baseScript, wrapFn) => {
      const condResult = wrapFn(baseScript);
      if (typeof condResult === "string") {
        scripts.push(condResult);
        return;
      }
      if (isChangeEvent) {
        scripts.push(condResult.unwrapped);
        mergedScripts.push(condResult.wrapped);
      } else {
        scripts.push(condResult.wrapped);
      }
    };
    this.componentActions.forEach((actions, component) => {
      if (component === "__global__") {
        actions.forEach((action) => {
          const globalScript = this.generateGlobalActionScript(action);
          applyCondition(globalScript, wrapWithConditions);
        });
        return;
      }
      const baseScript = this.generateActionScript(component, actions);
      if (baseScript !== null) {
        applyCondition(baseScript, wrapWithConditions);
      }
    });
    const elseBlockStatements = model.items?.length >= 5 ? model.items[4] : null;
    if (elseBlockStatements) {
      if (hasNoCondition) {
        const elseComponentActions = /* @__PURE__ */ new Map();
        const savedActions = this.componentActions;
        this.componentActions = elseComponentActions;
        if (elseBlockStatements.items) {
          elseBlockStatements.items.forEach((stmt) => this.processBlockStatement(stmt));
        }
        this.componentActions = savedActions;
        const elseScripts = [];
        elseComponentActions.forEach((actions, component) => {
          if (component === "__global__") {
            actions.forEach((action) => {
              const script = this.generateGlobalActionScript(action);
              if (script) {
                elseScripts.push(script);
              }
            });
            return;
          }
          const baseScript = this.generateActionScript(component, actions);
          if (baseScript !== null && baseScript !== "") {
            elseScripts.push(baseScript);
          }
        });
        const dispatchRe = /^(dispatchEvent\()(.+?)(, 'custom:setProperty', \{)(.+)(\}\))$/;
        elseScripts.forEach((elseScript) => {
          const elseMatch = elseScript.match(dispatchRe);
          if (!elseMatch) {
            scripts.push(elseScript);
            return;
          }
          const elseComp = elseMatch[2];
          const elseProps = elseMatch[4];
          const thenIdx = scripts.findIndex((s) => {
            const m = s.match(dispatchRe);
            return m && m[2] === elseComp;
          });
          if (thenIdx >= 0) {
            const thenMatch = scripts[thenIdx].match(dispatchRe);
            scripts[thenIdx] = `dispatchEvent(${elseComp}, 'custom:setProperty', {${thenMatch[4]}, ${elseProps}})`;
          } else {
            scripts.push(elseScript);
          }
        });
      } else {
        const elseCondition = `!(${this.eventCondition})`;
        const wrapWithElseConditions = (baseScript) => {
          if (isChangeEvent) {
            const innerScript = `if(${elseCondition}, ${baseScript}, {})`;
            return { unwrapped: innerScript, wrapped: `if(${changeWrapper}, ${innerScript}, {})` };
          }
          return { wrapped: `if(${elseCondition}, ${baseScript}, {})` };
        };
        this.componentActions.clear();
        if (elseBlockStatements.items) {
          elseBlockStatements.items.forEach((stmt) => this.processBlockStatement(stmt));
        }
        this.componentActions.forEach((actions, component) => {
          if (component === "__global__") {
            actions.forEach((action) => {
              const elseActionScript = this.generateGlobalActionScript(action);
              applyCondition(elseActionScript, wrapWithElseConditions);
            });
            return;
          }
          const baseScript = this.generateActionScript(component, actions);
          if (baseScript !== null) {
            applyCondition(baseScript, wrapWithElseConditions);
          }
        });
      }
    }
    this.result.script.content = scripts;
    this.result.rules = { validationStatus: "valid" };
    if (Object.keys(this.otherEvents).length > 0) {
      this.result.otherEvents = this.otherEvents;
    }
    return "";
  }
  /**
   * Determine event type from event condition node
   */
  // eslint-disable-next-line class-methods-use-this
  determineEventType(eventConditionNode) {
    const chosenCondition = eventConditionNode.choice;
    const getEventTypeFromComparison = (node) => {
      if (!node || node.nodeName !== "EVENT_AND_COMPARISON" || !node.items || node.items.length < 2) {
        return null;
      }
      const operator = node.items[1];
      const operatorNode = operator?.choice || operator;
      if (operatorNode?.nodeName === "is clicked") {
        return "click";
      }
      if (operatorNode?.nodeName === "is initialized") {
        return "initialize";
      }
      if (operatorNode?.nodeName === "is changed") {
        return "change";
      }
      return null;
    };
    if (chosenCondition?.nodeName === "BINARY_EVENT_CONDITION") {
      const firstCondition = chosenCondition.items?.[0];
      const innerComparison = firstCondition?.choice || firstCondition?.items?.[0];
      return getEventTypeFromComparison(innerComparison);
    }
    return getEventTypeFromComparison(chosenCondition);
  }
  /**
   * Extract event condition script
   */
  extractEventCondition(eventConditionNode) {
    const chosenCondition = eventConditionNode.choice;
    if (!chosenCondition) {
      return "__NO_CONDITION__";
    }
    if (chosenCondition.nodeName === "BINARY_EVENT_CONDITION") {
      return this.visit(chosenCondition);
    }
    if (chosenCondition.nodeName === "EVENT_AND_COMPARISON") {
      return this.visit(chosenCondition);
    }
    return "";
  }
  /**
   * Handle BINARY_EVENT_CONDITION node (multiple conditions with AND/OR)
   */
  enterBINARY_EVENT_CONDITION(model) {
    const prevInBinary = this.inBinaryCondition;
    this.inBinaryCondition = true;
    const left = this.visit(model.items[0]);
    const operator = this.visit(model.items[1]);
    const right = this.visit(model.items[2]);
    this.inBinaryCondition = prevInBinary;
    return `(${left} ${operator} ${right})`;
  }
  /**
   * Handle AND operator
   */
  // eslint-disable-next-line class-methods-use-this
  enterAND(_) {
    return "&&";
  }
  // eslint-disable-next-line class-methods-use-this
  enterOR(_) {
    return "||";
  }
  /**
   * Handle EVENT_AND_COMPARISON node
   */
  enterEVENT_AND_COMPARISON(model) {
    const componentWrapper = model.items[0];
    const operatorWrapper = model.items[1];
    const component = componentWrapper.choice || componentWrapper;
    const operator = operatorWrapper.choice || operatorWrapper;
    if (component && component.properties?.id && !this.eventSourceComponentId) {
      this.eventSourceComponentId = component.properties.id;
    }
    if (operator.nodeName === "is initialized") {
      if (this.toggleProvider.isEnabled("FT_FORMS_17090") && this.inBinaryCondition) {
        const type = component.value?.type;
        const isPrimitive = type && PRIMITIVE_TYPES.has(type.split("|")[0].trim());
        return isPrimitive ? "true().$value" : "true()";
      }
      return "__NO_CONDITION__";
    }
    if (operator.nodeName === "is clicked") {
      if (this.toggleProvider.isEnabled("FT_FORMS_21266") && this.inBinaryCondition) {
        if (component.value?.metadata?.isFirstField) {
          return "true()";
        }
        return this.visit(componentWrapper);
      }
      return "__NO_CONDITION__";
    }
    if (operator.nodeName === "HAS_SELECTED") {
      const right = model.items[2];
      const rightValue = this.visit(right);
      return `contains($field, ${rightValue})`;
    }
    if (operator.nodeName === "is changed") {
      if (this.inBinaryCondition) {
        const compRef = this.visit(componentWrapper);
        const primitiveExpr = model.items[2];
        const primitiveChoice = primitiveExpr?.choice;
        if (primitiveChoice && primitiveChoice.value != null) {
          const val = this.visit(primitiveExpr);
          return `${compRef}${val}`;
        }
        return compRef;
      }
      return "contains($event.payload.changes[].propertyName, 'value')";
    }
    if (operator.nodeName === "IS_TRUE") {
      const leftValue = this.visit(componentWrapper);
      return `${leftValue} == true() `;
    }
    if (operator.nodeName === "IS_FALSE") {
      const leftValue = this.visit(componentWrapper);
      return `${leftValue} == false() `;
    }
    if (operator.nodeName === "EQUALS_TO") {
      const leftValue = this.visit(model.items[0]);
      const rightValue = this.visit(model.items[2]);
      return `${leftValue} == ${rightValue}`;
    }
    if (operator.nodeName === "NOT_EQUALS_TO") {
      const leftValue = this.visit(model.items[0]);
      const rightValue = this.visit(model.items[2]);
      return `${leftValue} != ${rightValue}`;
    }
    if (operator.nodeName === "IS_EMPTY") {
      const leftValue = this.visit(model.items[0]);
      return `!(${leftValue})`;
    }
    if (operator.nodeName === "IS_NOT_EMPTY") {
      const leftValue = this.visit(model.items[0]);
      return `!(!(${leftValue}))`;
    }
    if (operator.nodeName === "LESS_THAN") {
      const leftValue = this.visit(model.items[0]);
      const rightValue = this.visit(model.items[2]);
      return `${leftValue} < ${rightValue}`;
    }
    if (operator.nodeName === "GREATER_THAN") {
      const leftValue = this.visit(model.items[0]);
      const rightValue = this.visit(model.items[2]);
      return `${leftValue} > ${rightValue}`;
    }
    if (operator.nodeName === "LESS_THAN_EQUAL") {
      const leftValue = this.visit(model.items[0]);
      const rightValue = this.visit(model.items[2]);
      return `${leftValue} <= ${rightValue}`;
    }
    if (operator.nodeName === "GREATER_THAN_EQUAL") {
      const leftValue = this.visit(model.items[0]);
      const rightValue = this.visit(model.items[2]);
      return `${leftValue} >= ${rightValue}`;
    }
    if (operator.nodeName === "IS_VALID") {
      if (this.toggleProvider.isEnabled("FT_FORMS_17090")) {
        let item = model.items[0];
        if (item?.nodeName === "EVENT_AND_COMPARISON_LEFT_HAND_EXPRESSION") {
          item = item.choice;
        }
        const validatedId = item?.value?.id || item?.properties?.id;
        if (!validatedId) {
          return "validate().length==0";
        }
        return `validate(${validatedId}).length==0`;
      }
      return `validate(${this.eventSourceComponentId}).length==0`;
    }
    if (operator.nodeName === "IS_NOT_VALID") {
      if (this.toggleProvider.isEnabled("FT_FORMS_17090")) {
        let item = model.items[0];
        if (item?.nodeName === "EVENT_AND_COMPARISON_LEFT_HAND_EXPRESSION") {
          item = item.choice;
        }
        const validatedId = item?.value?.id || item?.properties?.id;
        if (!validatedId) {
          return "validate().length!=0";
        }
        return `validate(${validatedId}).length!=0`;
      }
      return `validate(${this.eventSourceComponentId}).length!=0`;
    }
    if (operator.nodeName === "HAS_CHANGED") {
      return this.inBinaryCondition ? "$field" : "contains($event.payload.changes[].propertyName, 'value')";
    }
    if (operator.nodeName === "CONTAINS") {
      const leftValue = this.visit(componentWrapper);
      const rightValue = this.visit(model.items[2]);
      return `contains(${leftValue}, ${rightValue})`;
    }
    if (operator.nodeName === "DOES_NOT_CONTAIN") {
      const leftValue = this.visit(componentWrapper);
      const rightValue = this.visit(model.items[2]);
      return `!contains(${leftValue}, ${rightValue})`;
    }
    if (model.items[2]?.choice === null || model.items[2]?.choice === void 0) {
      return "__NO_CONDITION__";
    }
    return "";
  }
  /**
   * Process a BLOCK_STATEMENT and extract action
   */
  processBlockStatement(stmt) {
    const action = stmt.nodeName === "BLOCK_STATEMENT" || stmt.nodeName === "WSDL_BLOCK_STATEMENT" ? stmt.choice : stmt;
    if (!action) {
      return;
    }
    const actionType = action.nodeName;
    const addToComponentBucket = (componentId, entry) => {
      if (!this.componentActions.has(componentId)) {
        this.componentActions.set(componentId, []);
      }
      this.componentActions.get(componentId).push(entry);
    };
    if (["HIDE_STATEMENT", "SHOW_STATEMENT", "ENABLE_STATEMENT", "DISABLE_STATEMENT"].includes(actionType)) {
      if (action.items && action.items.length > 0) {
        const component = action.items[0];
        const componentId = component.properties?.id || component.value?.id;
        if (componentId) {
          addToComponentBucket(componentId, actionType);
        }
      }
    } else if (actionType === "SET_VALUE_STATEMENT" || actionType === "SET_PROPERTY") {
      let targetId;
      if (actionType === "SET_VALUE_STATEMENT") {
        targetId = action.items?.[0]?.value?.id || action.items?.[0]?.properties?.id;
      } else {
        const memberExpr = action.items?.[0];
        const componentNode = memberExpr?.items?.[2];
        targetId = componentNode?.value?.id || componentNode?.properties?.id;
      }
      if (targetId) {
        addToComponentBucket(targetId, action);
      } else {
        addToComponentBucket("__global__", action);
      }
    } else if (actionType === "CLEAR_VALUE_STATEMENT") {
      const targetId = action.items?.[0]?.value?.id || action.items?.[0]?.properties?.id;
      if (targetId) {
        addToComponentBucket(targetId, "CLEAR_VALUE");
      } else {
        addToComponentBucket("__global__", action);
      }
    } else {
      addToComponentBucket("__global__", action);
    }
  }
  /**
   * Generate action script for a component
   */
  generateActionScript(componentId, actions) {
    const scripts = [];
    const mergedProps = [];
    const constraintMessages = [];
    let constraintInsertIndex = -1;
    const CONSTRAINT_MESSAGE_KEYS = {
      minimumMessage: "minimum",
      maximumMessage: "maximum"
    };
    const flushMerged = () => {
      if (mergedProps.length === 0 && constraintMessages.length === 0) {
        return;
      }
      let allProps = mergedProps;
      if (this.toggleProvider.isEnabled("FT_FORMS_21359") && constraintMessages.length > 0) {
        const merged = `constraintMessage : [${constraintMessages.join(", ")}]`;
        const insertAt = constraintInsertIndex >= 0 ? constraintInsertIndex : mergedProps.length;
        allProps = [
          ...mergedProps.slice(0, insertAt),
          [null, merged],
          ...mergedProps.slice(insertAt)
        ];
        constraintInsertIndex = -1;
      }
      const propStr = allProps.map(([key, val]) => key === null ? val : this.generateNestedProperty(key, val)).join(", ");
      const componentName = this.currentEvent.field ? _JsonFormulaTransformer.getRelativeName(componentId, this.currentEvent.field) : componentId.split(".").pop();
      const isEventSource = componentId === this.eventSourceComponentId;
      scripts.push(isEventSource ? `{${propStr}}` : `dispatchEvent(${componentName}, 'custom:setProperty', {${propStr}})`);
      mergedProps.length = 0;
      constraintMessages.length = 0;
    };
    actions.forEach((action) => {
      if (typeof action === "string") {
        switch (action) {
          case "HIDE_STATEMENT":
            mergedProps.push(["visible", "false()"]);
            break;
          case "SHOW_STATEMENT":
            mergedProps.push(["visible", "true()"]);
            break;
          case "ENABLE_STATEMENT":
            mergedProps.push(["enabled", "true()"]);
            break;
          case "DISABLE_STATEMENT":
            mergedProps.push(["enabled", "false()"]);
            break;
          case "CLEAR_VALUE":
            mergedProps.push(["value", "`null`"]);
            break;
          default:
            break;
        }
      } else if (action.nodeName === "SET_PROPERTY") {
        const memberExpr = action.items?.[0];
        const propertyName = memberExpr?.items?.[0]?.value;
        const value = this.visit(action.items?.[2]);
        if (propertyName) {
          const constraintType = this.toggleProvider.isEnabled("FT_FORMS_21359") && CONSTRAINT_MESSAGE_KEYS[propertyName];
          if (constraintType) {
            if (constraintInsertIndex < 0) {
              constraintInsertIndex = mergedProps.length;
            }
            constraintMessages.push(`{ type : '${constraintType}', message : ${value} }`);
          } else {
            mergedProps.push([propertyName, value]);
          }
        }
      } else if (action.nodeName === "SET_VALUE_STATEMENT") {
        const targetField = action.items?.[0];
        const targetType = targetField?.value?.type || targetField?.properties?.type;
        const targetId = targetField?.value?.id || targetField?.properties?.id;
        const value = this.visit(action.items?.[2]);
        if (targetType === "PANEL" || targetType === "CONTAINER") {
          flushMerged();
          scripts.push(`importData(${value},'${targetId}')`);
        } else {
          mergedProps.push(["value", value]);
        }
      } else {
        flushMerged();
        scripts.push(this.generateGlobalActionScript(action));
      }
    });
    flushMerged();
    return scripts.join("\n");
  }
  /**
   * Build guide container path for WSDL/FDM requests
   * Appends JCR structure path to form path for AEM repository access
   * @param {string} formPath - Base form path (e.g., /content/forms/af/my-form)
   * @returns {string} - Full path with guide container
   */
  // eslint-disable-next-line class-methods-use-this
  getGuideContainerPath(formPath) {
    if (!formPath) {
      return "";
    }
    return `${formPath}/jcr:content/guideContainer`;
  }
  /**
   * Get JCR path for field from scope tree
   * Looks up field in scope tree and returns its path property
   * @param {string} fieldId - Field ID like $form.afJsonSchemaRoot.Pet.id_1
   * @returns {string} - Full JCR path from scope tree
   */
  getGuideNodePath(fieldId) {
    if (!fieldId) {
      return "";
    }
    const field = this.findNodeInTree(this.scope.treeJson, fieldId);
    if (!field || !field.path) {
      return "";
    }
    return field.path;
  }
  /**
   * Find a node in the tree by ID
   * @param {Object} node - Tree node to search
   * @param {string} targetId - ID to find
   * @returns {Object|null} - Found node or null
   */
  findNodeInTree(node, targetId) {
    if (!node) {
      return null;
    }
    if (node.id === targetId) {
      return node;
    }
    if (node.items && Array.isArray(node.items)) {
      for (const child of node.items) {
        const found = this.findNodeInTree(child, targetId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
  /**
   * Build WSDL input JSON structure from inputModel
   */
  buildWSDLInputJson(inputModel) {
    const result = {};
    const expressions = [];
    const savedInFunctionCall = this.inFunctionCall;
    this.inFunctionCall = true;
    Object.entries(inputModel).forEach(([key, param]) => {
      const { choice } = param;
      if (!choice) {
        return;
      }
      let expr;
      const model = ModelFactory.createModel(choice);
      expr = model ? this.visit(model) : null;
      if (!expr) {
        return;
      }
      const choiceNodeName = choice.nodeName;
      if ((choiceNodeName === "COMPONENT" || choiceNodeName === "AFCOMPONENT") && !expr.endsWith(".$value")) {
        expr = `${expr}.$value`;
      }
      const placeholder = `__EXPR_${expressions.length}__`;
      expressions.push(expr);
      if (key.includes(".")) {
        const parts = key.split(".");
        let current = result;
        for (let i = 0; i < parts.length; i += 1) {
          const part = parts[i];
          if (i === parts.length - 1) {
            current[part] = placeholder;
          } else {
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
        }
      } else {
        result[key] = placeholder;
      }
    });
    this.inFunctionCall = savedInFunctionCall;
    let jsonStr = JSON.stringify(result, null, 0);
    expressions.forEach((expr, i) => {
      jsonStr = jsonStr.replace(`"__EXPR_${i}__"`, expr);
    });
    jsonStr = jsonStr.replace(/":"/g, '": "');
    jsonStr = jsonStr.replace(/":/g, '": ');
    return jsonStr;
  }
  /**
   * Build request body for api-integration WSDL from inputModel + inputMapping.
   * Body params come from inputModel entries or inputMapping defaultValues.
   */
  buildApiIntegrationBody(inputModel, inputMapping) {
    const mappingByKey = {};
    (inputMapping || []).forEach((m) => {
      mappingByKey[m.apiKey] = m;
    });
    const result = {};
    let hasValues = false;
    const expressions = [];
    const savedInFunctionCall = this.inFunctionCall;
    this.inFunctionCall = true;
    Object.entries(inputModel || {}).forEach(([key, param]) => {
      const mapping = mappingByKey[key];
      if (mapping && mapping.in !== "body") {
        return;
      }
      let expr;
      if (param.choice) {
        const model = ModelFactory.createModel(param.choice);
        expr = model ? this.visit(model) : null;
      } else if (mapping?.defaultValue) {
        expr = `'${mapping.defaultValue}'`;
      }
      if (!expr) {
        return;
      }
      const choiceNode = param.choice;
      const choiceName = choiceNode?.nodeName;
      const isValueComponent = choiceName === "COMPONENT" || choiceName === "AFCOMPONENT";
      const mapType = (mapping?.type || "").trim().toUpperCase();
      if (isValueComponent && (mapType === "OBJECT" || mapType === "ARRAY") && !expr.endsWith(".$value")) {
        expr = `${expr}.$value`;
      }
      hasValues = true;
      const placeholder = `__EXPR_${expressions.length}__`;
      expressions.push(expr);
      const parts = key.split(".");
      let current = result;
      for (let i = 0; i < parts.length - 1; i += 1) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = placeholder;
    });
    this.inFunctionCall = savedInFunctionCall;
    if (!hasValues) {
      return "{}";
    }
    let jsonStr = JSON.stringify(result, null, 0);
    expressions.forEach((expr, i) => {
      jsonStr = jsonStr.replace(`"__EXPR_${i}__"`, expr);
    });
    jsonStr = jsonStr.replace(/":"/g, '": "');
    jsonStr = jsonStr.replace(/":/g, '": ');
    return jsonStr;
  }
  /**
   * Convert dotted property name to nested object notation
   * e.g., 'label.value' with 'test' becomes 'label : {value : 'test'}'
   */
  // eslint-disable-next-line class-methods-use-this
  generateNestedProperty(propertyName, value) {
    const parts = propertyName.split(".");
    if (parts.length === 1) {
      return `${propertyName} : ${value}`;
    }
    let result = value;
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      if (i === parts.length - 1) {
        result = `${parts[i]} : ${result}`;
      } else {
        result = `${parts[i]} : {${result}}`;
      }
    }
    return result;
  }
  /**
   * Generate script for global actions (SUBMIT_FORM, DISPATCH_EVENT, etc.)
   */
  generateGlobalActionScript(action) {
    const actionType = action.nodeName;
    switch (actionType) {
      case "SUBMIT_FORM":
        return "submitForm()";
      case "DISPATCH_EVENT": {
        const dispatchRawName = this.visit(action.items[0]);
        const dispatchEventName = dispatchRawName.startsWith("'custom:") ? dispatchRawName : dispatchRawName.replace(/^'/, "'custom:");
        const targetComp = action.items[2];
        const targetId = targetComp?.properties?.id || targetComp?.value?.id || "";
        const targetType = targetComp?.properties?.type || targetComp?.value?.type || "";
        const eventSourceRoot = this.eventSourceComponentId?.split(".")[0] || "$form";
        if (targetType === "FORM" && targetId !== eventSourceRoot) {
          return `dispatchEvent(${dispatchEventName})`;
        }
        const dispatchTarget = this.currentEvent.field ? _JsonFormulaTransformer.getRelativeName(targetId, this.currentEvent.field) : targetId;
        return `dispatchEvent(${dispatchTarget}, ${dispatchEventName})`;
      }
      case "RESET_FORM": {
        const targetId = action.value?.id || action.properties?.id;
        if (targetId) {
          const componentName = this.currentEvent.field ? _JsonFormulaTransformer.getRelativeName(targetId, this.currentEvent.field) : targetId.split(".").pop();
          return `dispatchEvent(${componentName}, 'reset')`;
        }
        return "dispatchEvent('reset')";
      }
      case "VALIDATE_FORM": {
        const fieldId = action.value?.id;
        if (fieldId) {
          return `validate(${_JsonFormulaTransformer.getRelativeName(fieldId, this.currentEvent.field)})`;
        }
        return "validate()";
      }
      case "ADD_INSTANCE": {
        const compNode = action.items[1];
        const fieldId = compNode?.properties?.id || compNode?.value?.id || "";
        const refField = this.currentEvent.field;
        const name = refField ? _JsonFormulaTransformer.getRelativeName(fieldId, refField) : fieldId;
        if (this.toggleProvider.isEnabled("FT_FORMS_16466")) {
          return `addInstance(${name}, getRelativeInstanceIndex(${fieldId}) + 1)`;
        }
        return `addInstance(${name})`;
      }
      case "REMOVE_INSTANCE": {
        const fieldId = action.items[1]?.properties?.id || "";
        const refField = this.currentEvent.field;
        const name = refField ? _JsonFormulaTransformer.getRelativeName(fieldId, refField) : fieldId;
        if (this.toggleProvider.isEnabled("FT_FORMS_16466")) {
          return `removeInstance(${name}, getRelativeInstanceIndex(${fieldId}))`;
        }
        return `removeInstance(${name}, length(${name}) - 1)`;
      }
      case "SET_FOCUS": {
        const component = action.items[1];
        const componentId = component?.value?.id || component?.properties?.id || "";
        let componentName;
        if (this.currentEvent.field) {
          const { field } = this.currentEvent;
          componentName = _JsonFormulaTransformer.getRelativeName(componentId, field);
        } else {
          componentName = componentId ? componentId.split(".").pop() : "";
        }
        return `dispatchEvent(${componentName},'focus')`;
      }
      case "NAVIGATE_IN_PANEL": {
        const focusOption = action.items[0];
        const panel = action.items[2];
        const panelId = panel?.properties?.id || panel?.value?.id || "";
        const direction = focusOption.choice?.nodeName;
        const directionStr = direction === "NEXT_ITEM" ? "nextItem" : "previousItem";
        return `setFocus(${panelId},'${directionStr}')`;
      }
      case "WSDL_STATEMENT": {
        const wsdlData = action.properties || {};
        const wsdlInfo = wsdlData.wsdlInfo || {};
        const callbacks = action.json?.callbacks || wsdlData.callbacks || {};
        wsdlCallSeq += 1;
        const callbackId = `${callbacks.id || 0}_${wsdlCallSeq}`;
        const successEvent = `custom:wsdlSuccess_${callbackId}`;
        const errorEvent = `custom:wsdlError_${callbackId}`;
        const processCallbacks = (callbackMap, eventName) => {
          const handlers = [];
          Object.values(callbackMap || {}).forEach((callbackNode) => {
            if (!callbackNode || callbackNode.nodeName !== "WSDL_CALLBACK_STATEMENT") {
              return;
            }
            const items = callbackNode.items || [];
            let conditionNode = null;
            let blockStmtsNode = null;
            items.forEach((item) => {
              if (item.nodeName === "CONDITION") {
                conditionNode = item;
              }
              if (item.nodeName === "WSDL_BLOCK_STATEMENTS") {
                blockStmtsNode = item;
              }
            });
            const conditionScript = conditionNode?.choice ? this.visit(ModelFactory.createModel(conditionNode.choice)) : null;
            const savedComponentActions = this.componentActions;
            this.componentActions = /* @__PURE__ */ new Map();
            (blockStmtsNode?.items || []).forEach((stmt) => {
              if (stmt.nodeName === "WSDL_BLOCK_STATEMENT") {
                this.processBlockStatement(stmt);
              }
            });
            this.componentActions.forEach((actions, comp) => {
              if (comp === "__global__") {
                actions.forEach((act) => {
                  const script = this.generateGlobalActionScript(act);
                  if (script) {
                    handlers.push(conditionScript ? `if(${conditionScript}, ${script}, {})` : script);
                  }
                });
              } else {
                const baseScript = this.generateActionScript(comp, actions);
                if (baseScript) {
                  baseScript.split("\n").forEach((line) => {
                    handlers.push(conditionScript ? `if(${conditionScript}, ${line}, {})` : line);
                  });
                }
              }
            });
            this.componentActions = savedComponentActions;
          });
          this.otherEvents[eventName] = { content: handlers, preserveEmpty: true };
        };
        if (wsdlInfo.type === "api-integration") {
          const inputJsonSpec = JSON.parse(wsdlInfo.inputJson || "{}");
          const {
            url: urlTemplate = "",
            method = "GET",
            contentType: rawContentType = "",
            inputMapping = [],
            encryptionRequired,
            publicKey
          } = inputJsonSpec;
          const contentType = rawContentType || "application/json";
          const inputModel2 = wsdlData.inputModel || {};
          const pathParams = inputMapping.filter((m) => m.in === "path").map((m) => m.apiKey);
          let urlExpr;
          if (pathParams.length === 0) {
            urlExpr = `'${urlTemplate}'`;
          } else {
            const parts = [];
            let remaining = urlTemplate;
            pathParams.forEach((param) => {
              const placeholder = `{${param}}`;
              const idx = remaining.indexOf(placeholder);
              if (idx >= 0) {
                if (idx > 0) {
                  parts.push(`'${remaining.slice(0, idx)}'`);
                }
                const paramData = inputModel2[param];
                const expr = paramData?.choice ? this.visit(ModelFactory.createModel(paramData.choice)) : "undefined";
                parts.push(expr);
                remaining = remaining.slice(idx + placeholder.length);
              }
            });
            if (remaining) {
              parts.push(`'${remaining}'`);
            }
            urlExpr = parts.join(" & ");
          }
          const body = this.buildApiIntegrationBody(inputModel2, inputMapping);
          const headers = `{"Content-Type": '${contentType}'}`;
          const decryptSuccessEvent = `custom:decryptSuccess_${callbackId}`;
          const decryptErrorEvent = `custom:decryptError_${callbackId}`;
          if (encryptionRequired && publicKey) {
            this.otherEvents[successEvent] = {
              content: `awaitFn(decrypt($event.payload.body, $event.payload.originalRequest), '${decryptSuccessEvent}', '${decryptErrorEvent}')`,
              scalar: true
            };
            this._encryptedCallback = true;
            processCallbacks(callbacks.success || wsdlData.onSuccess || {}, decryptSuccessEvent);
            this._encryptedCallback = false;
          } else {
            processCallbacks(callbacks.success || wsdlData.onSuccess || {}, successEvent);
          }
          processCallbacks(callbacks.failure || wsdlData.onFailure || {}, errorEvent);
          if (this.toggleProvider.isEnabled("FT_FORMS_19810")) {
            if (encryptionRequired && publicKey) {
              return `awaitFn(retryHandler(requestWithRetry(externalize(${urlExpr}), '${method}', encrypt({body: ${body}, headers: ${headers}}, '${publicKey}'), '${successEvent}','${errorEvent}')))`;
            }
            return `awaitFn(retryHandler(requestWithRetry(externalize(${urlExpr}), '${method}', ${body}, ${headers}, '${successEvent}','${errorEvent}')))`;
          }
          if (encryptionRequired && publicKey) {
            return `request(externalize(${urlExpr}),'${method}', encrypt({body: ${body}, headers: ${headers}}, '${publicKey}'), '${successEvent}','${errorEvent}')`;
          }
          return `request(externalize(${urlExpr}),'${method}', ${body}, ${headers}, '${successEvent}','${errorEvent}')`;
        }
        const formPath = wsdlData.formPath || this.scope?.treeJson?.path || "";
        const inputModel = wsdlData.inputModel || {};
        const outputModel = wsdlData.outputModel || {};
        const inputJson = this.buildWSDLInputJson(inputModel);
        const requestParams = {
          operationName: wsdlInfo.operationName,
          input: `toString(${inputJson})`,
          functionToExecute: "invokeFDMOperation",
          apiVersion: "2",
          formDataModelId: wsdlInfo.formDataModelId,
          runValidation: String(wsdlInfo.runValidation || false)
        };
        const currentFieldId = this.currentEvent.field;
        if (currentFieldId) {
          const guideNodePath = this.getGuideNodePath(currentFieldId);
          if (guideNodePath) {
            requestParams.guideNodePath = guideNodePath;
          }
        }
        if (wsdlInfo.schemaRef) {
          requestParams.schemaRef = wsdlInfo.schemaRef;
        }
        if (wsdlInfo.schemaType) {
          requestParams.schemaType = wsdlInfo.schemaType;
        }
        const paramsStr = Object.entries(requestParams).map(([key, val]) => key === "input" ? `"${key}":${val}` : `"${key}":'${val}'`).join(",");
        const successKeys = Object.keys(callbacks.success || wsdlData.onSuccess || {});
        const failureKeys = Object.keys(callbacks.failure || wsdlData.onFailure || {});
        const hasCallbacks = successKeys.length > 0 || failureKeys.length > 0;
        if (hasCallbacks) {
          processCallbacks(callbacks.success || wsdlData.onSuccess || {}, successEvent);
          processCallbacks(callbacks.failure || wsdlData.onFailure || {}, errorEvent);
        } else {
          const successHandlers = Object.entries(outputModel).map(([key, component]) => {
            const componentId = component.properties?.id || component.value?.id;
            const componentName = componentId ? componentId.split(".").pop() : key;
            return `dispatchEvent(${componentName},'custom:setProperty', {value: toObject($event.payload.body).${key}})`;
          });
          this.otherEvents[successEvent] = { content: successHandlers, preserveEmpty: true };
          this.otherEvents[errorEvent] = { content: [], preserveEmpty: true };
        }
        const guidePath = this.getGuideContainerPath(formPath);
        return `request(externalize('${guidePath}.af.dermis'), 'POST', {${paramsStr}}, {"Content-Type" : 'application/x-www-form-urlencoded'}, '${successEvent}','${errorEvent}')`;
      }
      case "NAVIGATE_TO": {
        const urlExpression = action.items[0];
        const methodOptions = action.items[2];
        const url = this.visit(urlExpression);
        const method = methodOptions?.items?.[0]?.nodeName ?? methodOptions?.choice?.nodeName;
        let target;
        if (method === "NEW_WINDOW") {
          target = "_newwindow";
        } else if (method === "NEW_TAB") {
          target = "_blank";
        } else {
          target = "_self";
        }
        return `navigateTo(${url}, '${target}')`;
      }
      case "SET_VALUE_STATEMENT": {
        const valueField = action.items[0];
        const expression = action.items[2];
        const componentId = valueField?.properties?.id;
        const value = this.visit(expression);
        if (componentId === this.eventSourceComponentId) {
          return `{value : ${value}}`;
        }
        let svComponentName;
        if (this.currentEvent.field) {
          svComponentName = _JsonFormulaTransformer.getRelativeName(componentId, this.currentEvent.field);
        } else {
          svComponentName = componentId ? componentId.split(".").pop() : "";
        }
        return `dispatchEvent(${svComponentName}, 'custom:setProperty', {value : ${value}})`;
      }
      case "SET_PROPERTY": {
        const memberExpression = action.items[0];
        const valueExpression = action.items[2];
        const propList = memberExpression.items[0];
        const propertyName = propList.value || propList.getValue();
        const component = memberExpression.items[2];
        const componentId = component?.properties?.id;
        const value = this.visit(valueExpression);
        const propertyObject = this.generateNestedProperty(propertyName, value);
        if (componentId === this.eventSourceComponentId) {
          return `{${propertyObject}}`;
        }
        let spComponentName;
        if (this.currentEvent.field) {
          spComponentName = _JsonFormulaTransformer.getRelativeName(componentId, this.currentEvent.field);
        } else {
          spComponentName = componentId ? componentId.split(".").pop() : "";
        }
        return `dispatchEvent(${spComponentName}, 'custom:setProperty', {${propertyObject}})`;
      }
      case "FUNCTION_CALL":
      case "SET_VARIABLE":
      case "ASYNC_FUNCTION_CALL":
        return this.visit(action);
      case "SAVE_FORM": {
        const originalId = this.scope?.treeJson?.options?.originalId;
        const formId = originalId ? btoa(originalId) : this.scope?.treeJson?.items?.find?.((n) => n.type?.includes?.("FORM"))?.id || "";
        return `saveForm(externalize('/adobe/forms/af/save/${formId}'))`;
      }
      case "WRITE_JSON_FORMULA": {
        const raw = this.visit(action.items[0]);
        return raw.replace(/^['"]|['"]$/g, "");
      }
      default:
        return "";
    }
  }
  /**
   * Handle VALIDATE_EXPRESSION node
   */
  enterVALIDATE_EXPRESSION(model) {
    const condition = model.items[3];
    if (model.items[0] && model.items[0].properties && model.items[0].properties.id) {
      this.currentEvent.field = model.items[0].properties.id;
    } else if (this.eventSourceComponentId) {
      this.currentEvent.field = this.eventSourceComponentId;
    }
    const conditionScript = this.visit(condition);
    this.result.validationExpression = conditionScript;
    this.result.rules = {
      validationStatus: "valid"
    };
    return conditionScript;
  }
  /**
   * Handle CONDITION node (duplicate removed — merged into the one at top of class)
   */
  /**
   * Handle FORMAT_EXPRESSION node
   */
  enterFORMAT_EXPRESSION(model) {
    const formatExpression = model.items[3];
    if (model.items[0] && model.items[0].properties && model.items[0].properties.id) {
      this.currentEvent.field = model.items[0].properties.id;
    } else if (this.eventSourceComponentId) {
      this.currentEvent.field = this.eventSourceComponentId;
    }
    const formatScript = this.visit(formatExpression);
    this.result.displayValueExpression = formatScript;
    this.result.rules = {
      validationStatus: "valid"
    };
    return formatScript;
  }
  /**
   * Handle NUMBER_FORMAT_EXPRESSION node
   */
  enterNUMBER_FORMAT_EXPRESSION(model) {
    if (model.choice) {
      return this.visit(model.choice);
    }
    return "";
  }
  /**
   * Handle CLEAR_EXPRESSION node
   */
  enterCLEAR_EXPRESSION(model) {
    const conditionOrAlways = model.items[2];
    if (model.items[0] && model.items[0].properties && model.items[0].properties.id) {
      this.currentEvent.field = model.items[0].properties.id;
    } else if (this.eventSourceComponentId) {
      this.currentEvent.field = this.eventSourceComponentId;
    }
    const valueScript = "null()";
    const conditionChild = conditionOrAlways?.choice;
    let finalScript;
    if (conditionChild) {
      const conditionScript = this.visit(conditionChild);
      finalScript = `if(${conditionScript},${valueScript},$field)`;
    } else {
      finalScript = valueScript;
    }
    this.result.rules = {
      value: finalScript,
      validationStatus: "valid"
    };
    return finalScript;
  }
  /**
   * Handle MEMBER_EXPRESSION node (e.g., component.property)
   */
  enterMEMBER_EXPRESSION(model) {
    const propertyList = model.items[0];
    const component = model.items[2];
    const propertyName = propertyList.getValue();
    const componentId = component?.getProperty?.("id") || component?.value?.id;
    if (componentId && typeof propertyName === "string" && this.scope) {
      const scopeComponent = this.scope.getComponent(componentId);
      if (!scopeComponent) {
        throw new Error(`Unknown component '${componentId}' in member expression`);
      }
      const allowed = this.scope.isPropertyAllowedForComponent(componentId, propertyName);
      if (!allowed) {
        throw new Error(`Invalid member property '${propertyName}' for component '${componentId}'`);
      }
    }
    const componentName = this.visit(component);
    return `${componentName}.$${propertyName}`;
  }
  /**
   * Handle PRIMITIVE_EXPRESSION node
   */
  enterPRIMITIVE_EXPRESSION(model) {
    if (model.choice) {
      return this.visit(model.choice);
    }
    if (model.items && model.items.length > 0) {
      return this.visit(model.items[0]);
    }
    return "";
  }
  /**
   * Handle EXTENDED_EXPRESSION node
   */
  enterEXTENDED_EXPRESSION(model) {
    if (model.choice) {
      return this.visit(model.choice);
    }
    return "";
  }
  /**
   * Handle BINARY_EXPRESSION node
   */
  enterBINARY_EXPRESSION(model) {
    const left = this.visit(model.items[0]);
    const operator = this.visit(model.items[1]);
    const right = this.visit(model.items[2]);
    return `(${left} ${operator} ${right})`;
  }
  /**
   * Handle CONCAT operator
   */
  // eslint-disable-next-line class-methods-use-this
  enterCONCAT(_) {
    return "&";
  }
  /**
   * Handle NUMERIC_LITERAL node
   */
  // eslint-disable-next-line class-methods-use-this
  enterNUMERIC_LITERAL(model) {
    const value = model.getValue ? model.getValue() : model.value;
    return String(value);
  }
  /**
   * Handle PLUS operator
   */
  // eslint-disable-next-line class-methods-use-this
  enterPLUS(_) {
    return "+";
  }
  // eslint-disable-next-line class-methods-use-this
  enterMINUS(_) {
    return "-";
  }
  // eslint-disable-next-line class-methods-use-this
  enterMULTIPLY(_) {
    return "*";
  }
  // eslint-disable-next-line class-methods-use-this
  enterDIVIDE(_) {
    return "/";
  }
  /**
   * Handle DISPATCH_EVENT node visited directly (e.g. from WSDL callback blocks).
   * Delegates to generateGlobalActionScript which handles both raw JSON and model instances.
   */
  enterDISPATCH_EVENT(model) {
    return this.generateGlobalActionScript(model);
  }
  /**
   * Handle FUNCTION_CALL node
   */
  enterFUNCTION_CALL(model) {
    const json = model.json || model;
    const functionInfo = json.functionName || {};
    const functionName = functionInfo.id;
    const { impl } = functionInfo;
    const funcArgs = functionInfo.args || [];
    if (!functionName) {
      return "";
    }
    const rawArgs = json.params || [];
    if (functionName === "getEventPayload") {
      const param = rawArgs[0];
      if (param && param.choice !== null) {
        const key = this.visit(ModelFactory.createModel(param));
        return `$event.payload.${key.replace(/^'|'$/g, "")}`;
      }
      return "$event.payload";
    }
    const scopeFunctionDef = this.scope?.getFunction?.(functionName);
    if (scopeFunctionDef?.isErrorHandler) {
      const callPayload = "toObject($event.payload.body), $event.payload.headers";
      if (functionName === "defaultErrorHandler") {
        return `${functionName}(${callPayload})`;
      }
      return `${functionName}(${callPayload}) && defaultErrorHandler(${callPayload})`;
    }
    if (!impl) {
      return "";
    }
    const previousInFunctionCall = this.inFunctionCall;
    const previousInFunctionCallAsObject = this.inFunctionCallAsObject;
    const args = rawArgs.map((arg, index) => {
      const isEmptySlot = !arg || arg.choice === null || arg.choice?.nodeName === "COMPONENT" && !arg.choice?.value;
      if (isEmptySlot) {
        return null;
      }
      const argType = funcArgs[index]?.type ?? "";
      const hasPrimitiveType = /STRING|NUMBER|BOOLEAN|DATE/.test(argType);
      const isComponentArg = !hasPrimitiveType && /OBJECT|AFCOMPONENT|FORM/.test(argType);
      this.inFunctionCall = true;
      this.inFunctionCallAsObject = isComponentArg;
      const argModel = ModelFactory.createModel(arg);
      const result2 = this.visit(argModel);
      return result2;
    });
    this.inFunctionCall = previousInFunctionCall;
    this.inFunctionCallAsObject = previousInFunctionCallAsObject;
    let result = impl.replace("$0", functionName);
    args.forEach((arg, index) => {
      const n = index + 1;
      const withDefault = new RegExp(`\\$${n}=([^,)]+)`);
      if (withDefault.test(result)) {
        result = result.replace(withDefault, (_, defaultVal) => arg === null ? defaultVal : arg);
      } else {
        result = result.replace(`$${n}`, arg === null ? "undefined" : arg);
      }
    });
    return result;
  }
  /**
   * Handle ASYNC_FUNCTION_CALL node.
   * Wraps the underlying function call with awaitFn(). If callbacks are present,
   * registers success/failure custom events and passes their names to awaitFn().
   */
  enterASYNC_FUNCTION_CALL(model) {
    const json = model.json || model;
    const funcCallModel = ModelFactory.createModel({ ...json, nodeName: "FUNCTION_CALL" });
    const funcScript = this.visit(funcCallModel);
    if (!json.callbacks) {
      return `awaitFn(${funcScript})`;
    }
    const callbackId = json.callbacks.id;
    const funcId = json.functionName?.id || "fn";
    const successEvent = `custom:${funcId}_success_${callbackId}`;
    const failureEvent = `custom:${funcId}_failure_${callbackId}`;
    ["success", "failure"].forEach((type) => {
      const callbackNode = json.callbacks[type];
      if (!callbackNode) {
        return;
      }
      const eventName = type === "success" ? successEvent : failureEvent;
      const subTransformer = new _JsonFormulaTransformer(this.scope, this.toggleProvider);
      subTransformer.currentEvent = { ...this.currentEvent };
      subTransformer.eventSourceComponentId = this.eventSourceComponentId;
      const callbackModel = ModelFactory.createModel(callbackNode);
      const callbackScript = subTransformer.visit(callbackModel);
      let content;
      if (Array.isArray(callbackScript)) {
        content = callbackScript;
      } else if (typeof callbackScript === "string" && callbackScript) {
        content = callbackScript.split("\n").filter(Boolean);
      } else if (Array.isArray(callbackScript?.content)) {
        content = callbackScript.content;
      } else if (Array.isArray(subTransformer.result?.script?.content)) {
        content = subTransformer.result.script.content;
      } else {
        content = [];
      }
      this.otherEvents[eventName] = { content, preserveEmpty: true };
      Object.entries(subTransformer.otherEvents || {}).forEach(([k, v]) => {
        if (k !== eventName) {
          this.otherEvents[k] = v;
        }
      });
    });
    return `awaitFn(${funcScript}, '${successEvent}', '${failureEvent}')`;
  }
  /**
   * Handle CALLBACK node — a list of CONDITION_BLOCK_STATEMENTS items.
   */
  enterCALLBACK(model) {
    if (!Array.isArray(model.items) || model.items.length === 0) {
      return "";
    }
    const scripts = [];
    model.items.forEach((item) => {
      const subTransformer = new _JsonFormulaTransformer(this.scope, this.toggleProvider);
      subTransformer.currentEvent = { ...this.currentEvent };
      subTransformer.eventSourceComponentId = this.eventSourceComponentId;
      const itemScript = subTransformer.visit(item);
      if (Array.isArray(itemScript)) {
        scripts.push(...itemScript);
      } else if (itemScript) {
        scripts.push(itemScript);
      } else {
        const content = subTransformer.result?.script?.content;
        if (Array.isArray(content)) {
          scripts.push(...content);
        } else if (content) {
          scripts.push(content);
        }
      }
      Object.entries(subTransformer.otherEvents || {}).forEach(([k, v]) => {
        this.otherEvents[k] = v;
      });
    });
    return scripts.join("\n");
  }
  /**
   * Handle CONDITION_BLOCK_STATEMENTS node.
   * Grammar: When CONDITION Then BLOCK_STATEMENTS
   * items: [When, CONDITION, Then, BLOCK_STATEMENTS]
   */
  enterCONDITION_BLOCK_STATEMENTS(model) {
    const conditionNode = model.items?.[1];
    const blockStatementsNode = model.items?.[3];
    if (!conditionNode || !blockStatementsNode) {
      return "";
    }
    const condScript = this.visit(conditionNode);
    const savedComponentActions = this.componentActions;
    this.componentActions = /* @__PURE__ */ new Map();
    (blockStatementsNode.items || []).forEach((stmt) => {
      this.processBlockStatement(stmt);
    });
    const scripts = [];
    this.componentActions.forEach((actions, comp) => {
      if (comp === "__global__") {
        actions.forEach((act) => {
          const script = this.generateGlobalActionScript(act);
          if (script) {
            scripts.push(condScript ? `if(${condScript}, ${script}, {})` : script);
          }
        });
      } else {
        const baseScript = this.generateActionScript(comp, actions);
        if (baseScript) {
          baseScript.split("\n").forEach((line) => {
            scripts.push(condScript ? `if(${condScript}, ${line}, {})` : line);
          });
        }
      }
    });
    this.componentActions = savedComponentActions;
    return scripts.join("\n");
  }
  /**
   * Handle SET_VARIABLE node
   * Structure: [key, VARIABLE_NAME(choice=name), value, VARIABLE_VALUE(choice=expr),
   *   on, AFCOMPONENT]
   */
  enterSET_VARIABLE(model) {
    const name = this.visit(ModelFactory.createModel(model.items[1]));
    const varValueNode = model.items[3];
    const varValueChoice = varValueNode?.choice;
    let val;
    if (varValueChoice?.nodeName === "AFCOMPONENT") {
      const refId = varValueChoice?.value?.id || varValueChoice?.properties?.id;
      const refField2 = this.currentEvent.field || this.eventSourceComponentId;
      val = refField2 ? _JsonFormulaTransformer.getRelativeName(refId, refField2) : refId || "";
    } else {
      val = this.visit(varValueNode);
    }
    const componentNode = model.items[5];
    const componentId = componentNode?.value?.id || componentNode?.properties?.id;
    if (!componentId || componentId === "$globalForm") {
      return `setVariable(${name}, ${val})`;
    }
    const refField = this.currentEvent.field || this.eventSourceComponentId;
    const component = refField ? _JsonFormulaTransformer.getRelativeName(componentId, refField) : componentId;
    return `setVariable(${name}, ${val}, ${component})`;
  }
  /**
   * Handle GET_VARIABLE node (old grammar, backward-compat with saved JCR data)
   * Structure: [key, VARIABLE_NAME(choice=name), from, AFCOMPONENT]
   */
  enterGET_VARIABLE(model) {
    const name = this.visit(ModelFactory.createModel(model.items[1]));
    const componentNode = model.items[3];
    const componentId = componentNode?.value?.id || componentNode?.properties?.id;
    if (!componentId || componentId === "$globalForm") {
      return `getVariable(${name})`;
    }
    const refField = this.currentEvent.field || this.eventSourceComponentId;
    const component = refField ? _JsonFormulaTransformer.getRelativeName(componentId, refField) : componentId;
    return `getVariable(${name}, ${component})`;
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/transformers/JsonFormulaMerger.js
var ARRAY_EVENTS = ["Value Commit", "Click", "Initialize"];
var isArrayEvent = (eventName) => ARRAY_EVENTS.indexOf(eventName) > -1 || eventName && eventName.startsWith("custom:");
var wrapValueCommitLine = (line) => `if(contains($event.payload.changes[].propertyName, 'value'), ${line}, {})`;
var mergeIntoField = (fieldEvents, script) => {
  const {
    event: eventName,
    content,
    scalar,
    preserveEmpty
  } = script;
  if (scalar) {
    return { ...fieldEvents, [eventName]: { content, scalar: true } };
  }
  const isEvent = isArrayEvent(eventName);
  const existing = fieldEvents[eventName] || { content: isEvent ? [] : "" };
  const existingPreserveEmpty = existing.preserveEmpty || false;
  let mergedContent;
  if (isEvent) {
    const newContent = eventName === "Value Commit" ? content.map(wrapValueCommitLine) : content;
    const combined = existing.content.concat(newContent);
    mergedContent = combined;
  } else {
    mergedContent = existing.content ? `${existing.content} || ${content}` : content;
  }
  const merged = preserveEmpty || existingPreserveEmpty;
  return { ...fieldEvents, [eventName]: { content: mergedContent, preserveEmpty: merged } };
};
var mergeScript = (scriptArray) => scriptArray.reduce((fields, script) => {
  const { field } = script;
  const fieldEvents = fields[field] || {};
  return { ...fields, [field]: mergeIntoField(fieldEvents, script) };
}, {});
var JsonFormulaMerger = { mergeScript };

// node_modules/@aemforms/rule-editor-transformer/src/validators/RuleValidator.js
var CONTEXT_RULES = {
  "fd:click": /* @__PURE__ */ new Set(["EVENT_SCRIPTS"]),
  "fd:change": /* @__PURE__ */ new Set(["EVENT_SCRIPTS"]),
  "fd:initialize": /* @__PURE__ */ new Set(["EVENT_SCRIPTS"]),
  // Legacy mapping stores change-event scripts under fd:valueCommit.
  "fd:valueCommit": /* @__PURE__ */ new Set(["EVENT_SCRIPTS"]),
  // fd:calc stores calculate/clear expressions in legacy rule persistence.
  "fd:calc": /* @__PURE__ */ new Set(["CALC_EXPRESSION", "CLEAR_EXPRESSION"]),
  "fd:format": /* @__PURE__ */ new Set(["FORMAT_EXPRESSION"]),
  "fd:validate": /* @__PURE__ */ new Set(["VALIDATE_EXPRESSION"]),
  // fd:visible stores conditional visibility expressions (hide when / show when).
  "fd:visible": /* @__PURE__ */ new Set(["VISIBLE_EXPRESSION", "SHOW_EXPRESSION"]),
  // fd:enabled stores conditional enabled/disabled expressions (enable when / disable when).
  "fd:enabled": /* @__PURE__ */ new Set(["ACCESS_EXPRESSION", "DISABLE_EXPRESSION"])
};
var DEFAULT_TYPES_REGISTRY = new TypesRegistry();
var FT_GATED_NODES = {
  FORMAT_EXPRESSION: "FT_FORMS_13193",
  ASYNC_FUNCTION_CALL: "FT_FORMS_13519",
  CALLBACK: "FT_FORMS_13519",
  CONDITION_BLOCK_STATEMENTS: "FT_FORMS_13519",
  WSDL_CALLBACK_STATEMENT: "FT_FORMS_11584"
};
var pushDiagnostic = (diagnostics, severity, details) => {
  diagnostics[severity].push({
    code: details.code,
    message: details.message,
    path: details.path,
    node: details.node ?? null,
    expected: details.expected,
    actual: details.actual,
    alternatives: details.alternatives,
    available: details.available,
    requiredToggle: details.requiredToggle
  });
};
var parseSequenceRule = (nodeName, toggleProvider) => {
  const ruleText = getRule(nodeName, toggleProvider);
  if (!ruleText) {
    return null;
  }
  if (ruleText.includes("|") || ruleText.includes("+") || ruleText.includes("*")) {
    return null;
  }
  return ruleText.split(/\s+/).filter(Boolean);
};
var getGrammarModelType = (nodeName, toggleProvider) => {
  const ruleText = getRule(nodeName, toggleProvider);
  if (!ruleText) {
    return "unknown";
  }
  if (ruleText.includes("|")) {
    return "choice";
  }
  if (ruleText.includes("+") || ruleText.includes("*")) {
    return "list";
  }
  return "sequence";
};
var collectTreeIds = (treeNode) => {
  if (!treeNode || typeof treeNode !== "object") {
    return /* @__PURE__ */ new Set();
  }
  const currentId = treeNode.id ? [treeNode.id] : [];
  const nestedIds = Array.isArray(treeNode.items) ? treeNode.items.flatMap((child) => [...collectTreeIds(child)]) : [];
  return /* @__PURE__ */ new Set([...currentId, ...nestedIds]);
};
var formatTypeTokens = (typeValue) => {
  if (Array.isArray(typeValue)) {
    return typeValue.flatMap((token) => String(token).split("|")).map((token) => token.trim()).filter(Boolean);
  }
  if (typeof typeValue === "string") {
    return typeValue.split("|").map((token) => token.trim()).filter(Boolean);
  }
  return [];
};
var validateSequenceNode = (node, path, diagnostics, toggleProvider) => {
  const expectedSequence = parseSequenceRule(node.nodeName, toggleProvider);
  if (!expectedSequence || !Array.isArray(node.items)) {
    return;
  }
  const actualNodeNames = node.items.map((item) => item?.nodeName);
  const ftLength = expectedSequence.length;
  const allowBase = isFtBaseAllowed(node.nodeName, toggleProvider);
  const baseSequence = allowBase ? parseSequenceRule(node.nodeName, null) : null;
  const baseLength = baseSequence?.length ?? ftLength;
  const matchesFt = actualNodeNames.length === ftLength;
  const matchesBase = allowBase && actualNodeNames.length === baseLength;
  if (!matchesFt && !matchesBase) {
    const lengthDesc = allowBase && baseLength !== ftLength ? `${baseLength} or ${ftLength}` : String(ftLength);
    pushDiagnostic(diagnostics, "errors", {
      code: "GRAMMAR_SEQUENCE_MISMATCH",
      message: `Expected ${lengthDesc} nodes for ${node.nodeName}, found ${actualNodeNames.length}`,
      path: `${path}.items`,
      node: node.nodeName,
      expected: expectedSequence,
      actual: actualNodeNames,
      alternatives: expectedSequence
    });
    return;
  }
  const primarySequence = !matchesFt && matchesBase ? baseSequence : expectedSequence;
  const fallbackSequence = allowBase && matchesFt && matchesBase ? baseSequence : null;
  const mismatches = [];
  primarySequence.forEach((expectedNode, index) => {
    const actual = actualNodeNames[index];
    if (actual !== expectedNode) {
      mismatches.push({ index, expectedNode, actual });
    }
  });
  if (mismatches.length > 0 && fallbackSequence) {
    const fallbackMismatches = fallbackSequence.filter((expectedNode, index) => actualNodeNames[index] !== expectedNode);
    if (fallbackMismatches.length === 0) {
      return;
    }
  }
  mismatches.forEach(({ index, expectedNode, actual }) => {
    pushDiagnostic(diagnostics, "errors", {
      code: "GRAMMAR_SEQUENCE_MISMATCH",
      message: `Expected ${expectedNode} at index ${index} for ${node.nodeName}, found ${actual ?? "undefined"}`,
      path: `${path}.items[${index}].nodeName`,
      node: node.nodeName,
      expected: expectedNode,
      actual: actual ?? null,
      alternatives: primarySequence
    });
  });
};
var validateContext = (ruleAST, storagePath, diagnostics) => {
  if (!storagePath || !CONTEXT_RULES[storagePath]) {
    return;
  }
  const actualStatement = ruleAST?.items?.[0]?.choice?.nodeName;
  if (!actualStatement) {
    return;
  }
  if (CONTEXT_RULES[storagePath].has(actualStatement)) {
    return;
  }
  pushDiagnostic(diagnostics, "errors", {
    code: "CONTEXT_STATEMENT_MISMATCH",
    message: `Statement ${actualStatement} is invalid for ${storagePath} context`,
    path: "$.items[0].choice.nodeName",
    node: "STATEMENT",
    expected: [...CONTEXT_RULES[storagePath]],
    actual: actualStatement,
    alternatives: [...CONTEXT_RULES[storagePath]]
  });
};
var RuleValidator = class _RuleValidator {
  constructor(scope, toggleProvider) {
    this.scope = scope || {};
    this.componentIds = collectTreeIds(this.scope.treeJson);
    this.toggleProvider = toggleProvider || new StaticToggleProvider();
  }
  validate(ruleAST, storagePath) {
    const diagnostics = {
      errors: [],
      warnings: []
    };
    if (!ruleAST || typeof ruleAST !== "object") {
      pushDiagnostic(diagnostics, "errors", {
        code: "VALIDATION_INPUT_INVALID",
        message: "validate expects a non-null object",
        path: "$",
        node: null
      });
      return { valid: false, ...diagnostics };
    }
    this._walk(ruleAST, "$", diagnostics);
    validateContext(ruleAST, storagePath, diagnostics);
    return {
      valid: diagnostics.errors.length === 0,
      ...diagnostics
    };
  }
  _walk(node, path, diagnostics, parent = null) {
    if (!node || typeof node !== "object") {
      pushDiagnostic(diagnostics, "errors", {
        code: "GRAMMAR_NODE_INVALID",
        message: "Expected AST node object",
        path,
        node: null
      });
      return;
    }
    if (!node.nodeName || typeof node.nodeName !== "string") {
      pushDiagnostic(diagnostics, "errors", {
        code: "GRAMMAR_NODE_NAME_MISSING",
        message: "Each AST node must contain nodeName",
        path: `${path}.nodeName`,
        node: null
      });
      return;
    }
    const requiredToggle = FT_GATED_NODES[node.nodeName];
    if (requiredToggle && this.toggleProvider && !this.toggleProvider.isEnabled(requiredToggle)) {
      pushDiagnostic(diagnostics, "errors", {
        code: "FT_MISMATCH",
        message: `${node.nodeName} requires feature toggle ${requiredToggle} to be enabled`,
        path,
        node: node.nodeName,
        requiredToggle
      });
      return;
    }
    if (node.nodeName === "SET_VALUE_STATEMENT" && this.toggleProvider && !this.toggleProvider.isEnabled("FT_FORMS_11584")) {
      const targetField = node.items?.[0];
      const targetType = targetField?.value?.type || targetField?.properties?.type;
      if (targetType === "PANEL" || targetType === "CONTAINER") {
        pushDiagnostic(diagnostics, "errors", {
          code: "FT_MISMATCH",
          message: "SET_VALUE_STATEMENT targeting PANEL/CONTAINER requires feature toggle FT_FORMS_11584 to be enabled",
          path,
          node: "SET_VALUE_STATEMENT",
          requiredToggle: "FT_FORMS_11584"
        });
        return;
      }
    }
    validateSequenceNode(node, path, diagnostics, this.toggleProvider);
    this._validateFunctionNode(node, path, diagnostics);
    this._validateMemberExpression(node, path, diagnostics);
    _RuleValidator.validateOperatorNode(node, path, diagnostics, parent);
    const modelType = getGrammarModelType(node.nodeName, this.toggleProvider);
    if ((modelType === "sequence" || modelType === "list") && Object.prototype.hasOwnProperty.call(node, "items") && !Array.isArray(node.items)) {
      pushDiagnostic(diagnostics, "errors", {
        code: "GRAMMAR_MODEL_MISMATCH",
        message: `Node ${node.nodeName} must use items as an array`,
        path: `${path}.items`,
        node: node.nodeName,
        expected: "items[]",
        actual: typeof node.items
      });
      return;
    }
    if (modelType === "choice" && Object.prototype.hasOwnProperty.call(node, "choice") && node.choice != null && typeof node.choice !== "object") {
      pushDiagnostic(diagnostics, "errors", {
        code: "GRAMMAR_MODEL_MISMATCH",
        message: `Node ${node.nodeName} must use choice as an object or null`,
        path: `${path}.choice`,
        node: node.nodeName,
        expected: "choice object | null",
        actual: typeof node.choice
      });
      return;
    }
    if (Array.isArray(node.items)) {
      node.items.forEach((child, index) => {
        this._walk(child, `${path}.items[${index}]`, diagnostics, node);
      });
    }
    if (node.choice) {
      this._walk(node.choice, `${path}.choice`, diagnostics, node);
    }
  }
  _validateFunctionNode(node, path, diagnostics) {
    if (node.nodeName !== "FUNCTION_CALL") {
      return;
    }
    const functionId = node?.functionName?.id || node?.functionName?.name;
    if (!functionId) {
      pushDiagnostic(diagnostics, "errors", {
        code: "SEMANTIC_FUNCTION_NAME_MISSING",
        message: "FUNCTION_CALL requires functionName.id",
        path: `${path}.functionName.id`,
        node: "FUNCTION_CALL"
      });
      return;
    }
    const functionDef = this.scope.getFunction?.(functionId);
    if (!functionDef) {
      const availableFunctions = Object.keys(this.scope.functions || {}).sort();
      pushDiagnostic(diagnostics, "errors", {
        code: "SEMANTIC_FUNCTION_UNKNOWN",
        message: `Function '${functionId}' was not found in scope definitions`,
        path: `${path}.functionName.id`,
        node: "FUNCTION_CALL",
        available: availableFunctions
      });
      return;
    }
    const expectedArity = Array.isArray(functionDef.args) ? functionDef.args.filter((a) => a.name !== "globals").length : 0;
    const actualArity = Array.isArray(node.params) ? node.params.length : 0;
    if (expectedArity !== actualArity) {
      pushDiagnostic(diagnostics, "errors", {
        code: "SEMANTIC_FUNCTION_ARITY_MISMATCH",
        message: `Function '${functionId}' expects ${expectedArity} arguments but received ${actualArity}`,
        path: `${path}.params`,
        node: "FUNCTION_CALL"
      });
    }
  }
  _validateMemberExpression(node, path, diagnostics) {
    if (node.nodeName !== "MEMBER_EXPRESSION") {
      return;
    }
    if (!Array.isArray(node.items) || node.items.length < 3) {
      return;
    }
    const property = node.items[0]?.value;
    const componentId = node.items[2]?.value?.id;
    if (!componentId) {
      return;
    }
    if (!this.componentIds.has(componentId)) {
      pushDiagnostic(diagnostics, "errors", {
        code: "SEMANTIC_MEMBER_COMPONENT_UNKNOWN",
        message: `Component '${componentId}' was not found in scope`,
        path: `${path}.items[2].value.id`,
        node: "MEMBER_EXPRESSION"
      });
      return;
    }
    const componentNode = this._findComponent(this.scope.treeJson, componentId);
    const availableProperties = this._getAllowedMemberProperties(componentNode?.type);
    if (typeof property === "string" && !availableProperties.includes(property)) {
      const typeTokens = formatTypeTokens(componentNode?.type);
      const typeLabel = typeTokens.length > 0 ? typeTokens.join("|") : "unknown";
      pushDiagnostic(diagnostics, "errors", {
        code: "SEMANTIC_MEMBER_PROPERTY_INVALID",
        message: `Property '${property}' is not valid for component '${componentId}' (types: ${typeLabel})`,
        path: `${path}.items[0].value`,
        node: "MEMBER_EXPRESSION",
        available: [...availableProperties].sort()
      });
    }
  }
  static validateOperatorNode(node, path, diagnostics, parent) {
    if (node.nodeName !== "OPERATOR") {
      return;
    }
    const operatorName = node.choice?.nodeName;
    if (!operatorName) {
      pushDiagnostic(diagnostics, "errors", {
        code: "GRAMMAR_OPERATOR_MISSING",
        message: "OPERATOR node must have a choice",
        path: `${path}.choice`,
        node: "OPERATOR"
      });
      return;
    }
    if (!parent) {
      return;
    }
    const validOperators = _RuleValidator.getValidOperatorsForContext(parent.nodeName);
    if (!validOperators || validOperators.length === 0) {
      return;
    }
    if (!validOperators.includes(operatorName)) {
      pushDiagnostic(diagnostics, "errors", {
        code: "GRAMMAR_OPERATOR_INVALID",
        message: `Operator '${operatorName}' is not valid in ${parent.nodeName} context`,
        path: `${path}.choice.nodeName`,
        node: parent.nodeName,
        expected: validOperators,
        actual: operatorName,
        alternatives: validOperators
      });
    }
  }
  static getValidOperatorsForContext(contextNodeName) {
    const config = GrammarConfig[contextNodeName];
    if (!config?.validOperators) {
      return null;
    }
    const spec = config.validOperators;
    if (Array.isArray(spec)) {
      return spec;
    }
    if (spec.groups && Array.isArray(spec.groups)) {
      const operators = spec.groups.flatMap((group) => OperatorGroups[group] || []);
      if (Array.isArray(spec.add)) {
        operators.push(...spec.add);
      }
      return [...new Set(operators)];
    }
    return null;
  }
  static _validateContext(ruleAST, storagePath, diagnostics) {
    if (!storagePath || !CONTEXT_RULES[storagePath]) {
      return;
    }
    const actualStatement = ruleAST?.items?.[0]?.choice?.nodeName;
    if (!actualStatement) {
      return;
    }
    if (CONTEXT_RULES[storagePath].has(actualStatement)) {
      return;
    }
    pushDiagnostic(diagnostics, "errors", {
      code: "CONTEXT_STATEMENT_MISMATCH",
      message: `Statement ${actualStatement} is invalid for ${storagePath} context`,
      path: "$.items[0].choice.nodeName",
      node: "STATEMENT",
      expected: [...CONTEXT_RULES[storagePath]],
      actual: actualStatement,
      alternatives: [...CONTEXT_RULES[storagePath]]
    });
  }
  _findComponent(node, id) {
    if (!node || typeof node !== "object") {
      return null;
    }
    if (node.id === id) {
      return node;
    }
    if (!Array.isArray(node.items)) {
      return null;
    }
    const candidates = node.items.map((child) => this._findComponent(child, id));
    return candidates.find(Boolean) || null;
  }
  _getAllowedMemberProperties(typeValue) {
    if (typeof this.scope?.getAllowedPropertiesForType === "function") {
      return this.scope.getAllowedPropertiesForType(typeValue);
    }
    return DEFAULT_TYPES_REGISTRY.getAllowedPropertiesForType(typeValue);
  }
};
function validateRule(ruleAST, options = {}) {
  return new RuleValidator(options.scope, options.toggleProvider).validate(ruleAST, options.storagePath);
}

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
var EVENT_MAPPING = {
  Click: "event:click",
  Initialize: "event:initialize",
  "Value Commit": "event:change",
  Validate: "validationExpression",
  Format: "displayValueExpression",
  Visibility: "visible",
  Calculate: "value",
  Enabled: "enabled",
  "Successful Submission": "event:submitSuccess",
  "Error in Submission": "event:submitError",
  "Saved successfully": "event:custom_saveSuccess",
  "Error while saving the form": "event:custom_saveError",
  "Layout Ready": "event:layout_ready",
  "Form Ready": "event:form_ready",
  "Doc Ready": "event:doc_ready"
};
var FIELD_KEY = "__field__";
var isFdKey = (key) => key.startsWith("fd:");
var shouldSkip = (parsed) => parsed.enabled === false || parsed.isValid === false;
var transformRule = (scope, toggleProvider, fdKey, jsonString, options = {}) => {
  const parsed = JSON.parse(jsonString);
  if (shouldSkip(parsed)) {
    return null;
  }
  if (options.preflight !== false) {
    const diagnostics = validateRule(parsed, { scope, storagePath: fdKey, toggleProvider });
    if (options.throwOnValidationError !== false && diagnostics.errors.length > 0) {
      throw new Error(
        `FieldTransformer preflight validation failed for ${fdKey} with ${diagnostics.errors.length} error(s)`
      );
    }
  }
  const fdEventName = FD_KEY_TO_EVENT[fdKey] || parsed.eventName;
  if (!fdEventName) {
    return null;
  }
  const model = ModelFactory.createModel(parsed);
  const transformer = new JsonFormulaTransformer(scope, toggleProvider);
  const result = transformer.transform(model);
  const otherEvents = result.otherEvents || null;
  const field = result.field || FIELD_KEY;
  const eventName = result.event || fdEventName;
  const content = result.content || [];
  return {
    field,
    event: eventName,
    content: Array.isArray(content) ? content : [content].filter(Boolean),
    otherEvents
  };
};
var iterateAndTransform = (scope, toggleProvider, fdRulesNode, options = {}) => {
  const scriptArray = [];
  Object.entries(fdRulesNode).forEach(([key, value]) => {
    if (!isFdKey(key) || !Array.isArray(value)) {
      return;
    }
    value.forEach((jsonString) => {
      const entry = transformRule(scope, toggleProvider, key, jsonString, options);
      if (entry) {
        scriptArray.push(entry);
        if (entry.otherEvents) {
          Object.entries(entry.otherEvents).forEach(([evtName, evtContent]) => {
            const scalar = evtContent?.scalar || false;
            const preserveEmpty = evtContent?.preserveEmpty || false;
            const content = evtContent && evtContent.content !== void 0 ? evtContent.content : evtContent;
            let normalizedContent;
            if (scalar) {
              normalizedContent = content;
            } else {
              normalizedContent = Array.isArray(content) ? content : [content].filter(Boolean);
            }
            scriptArray.push({
              field: FIELD_KEY,
              event: evtName,
              content: normalizedContent,
              scalar,
              preserveEmpty,
              otherEvents: null
            });
          });
        }
      }
    });
  });
  return scriptArray;
};
var mapToJcr = (merged) => {
  if (!merged || Object.keys(merged).length === 0) {
    return {};
  }
  const eventMap = {};
  Object.values(merged).forEach((bucket) => {
    Object.entries(bucket).forEach(([eventName, value]) => {
      if (!eventMap[eventName]) {
        eventMap[eventName] = value;
      } else if (eventMap[eventName].scalar || value.scalar) {
        eventMap[eventName] = value.scalar ? value : eventMap[eventName];
      } else {
        const existingContent = eventMap[eventName].content || [];
        const newContent = value.content || [];
        const preserveEmpty = eventMap[eventName].preserveEmpty || value.preserveEmpty;
        eventMap[eventName] = { content: [...existingContent, ...newContent], preserveEmpty };
      }
    });
  });
  const fdEvents = {};
  const fdRules = {};
  const topLevel = {};
  Object.entries(eventMap).forEach(([eventName, evtData]) => {
    const { content, preserveEmpty } = evtData;
    if (content === null || content === void 0 || content === "") {
      return;
    }
    if (Array.isArray(content) && content.length === 0 && !preserveEmpty) {
      return;
    }
    const mappedName = EVENT_MAPPING[eventName];
    const scalarContent = Array.isArray(content) && content.length === 1 ? content[0] : content;
    if (mappedName && mappedName.startsWith("event:")) {
      const eventKey = mappedName.slice("event:".length);
      fdEvents[eventKey] = content;
    } else if (mappedName === "validationExpression" || mappedName === "displayValueExpression") {
      topLevel[mappedName] = scalarContent;
    } else if (mappedName === "value" || mappedName === "enabled" || mappedName === "visible") {
      fdRules[mappedName] = scalarContent;
    } else if (!mappedName && eventName.startsWith("custom:")) {
      const customKey = `custom_${eventName.slice("custom:".length)}`;
      fdEvents[customKey] = content;
    } else if (!mappedName) {
      fdEvents[`custom_${eventName}`] = content;
    }
  });
  const result = { ...topLevel };
  if (Object.keys(fdEvents).length > 0) {
    result["fd:events"] = fdEvents;
  }
  if (Object.keys(fdRules).length > 0) {
    result["fd:rules"] = fdRules;
  }
  return result;
};
var FieldTransformer = class {
  constructor({ scope, toggleProvider }) {
    this.scope = scope;
    this.toggleProvider = toggleProvider;
  }
  /**
   * @param {Object} fdRulesNode - Object with fd:* keys each holding array of rule JSON strings
   * @returns {Object} - JCR output with fd:events, fd:rules, validationExpression, etc.
   */
  transform(fdRulesNode, options = {}) {
    const preflightOptions = {
      preflight: options.preflight !== false,
      throwOnValidationError: options.throwOnValidationError !== false
    };
    const opts = preflightOptions;
    const scriptArray = iterateAndTransform(this.scope, this.toggleProvider, fdRulesNode, opts);
    if (scriptArray.length === 0) {
      return {};
    }
    const merged = JsonFormulaMerger.mergeScript(scriptArray);
    return mapToJcr(merged);
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/RuleTransformer.js
var RuleTransformer = class {
  /**
   * Create a RuleTransformer instance
   * @param {Object} config - Configuration
   * @param {Object} config.scope - Scope configuration
   * @param {Object} config.scope.treeJson - Tree structure from ScopeBuilder
   * @param {Array} config.scope.customFunctions - Custom functions array
   * @param {Object} [config.toggleProvider] - ToggleProvider instance with isEnabled(key) method.
   *   Defaults to StaticToggleProvider(DEFAULT_TOGGLES).
   */
  constructor(config) {
    if (!(config?.scope instanceof RBScope)) {
      throw new Error("RuleTransformer requires scope to be an instance of RBScope");
    }
    this.scope = config.scope;
    this.toggleProvider = config.toggleProvider ?? new StaticToggleProvider(DEFAULT_TOGGLES);
  }
  /**
   * Validate rule JSON in preflight mode
   * @param {Object} input - Rule AST to validate
   * @param {Object} [options]
   * @param {string} [options.storagePath] - Optional storage context (e.g. fd:click)
   * @returns {{ valid: boolean, errors: Array, warnings: Array }}
   */
  validate(input, options = {}) {
    if (!input || typeof input !== "object") {
      throw new Error("RuleTransformer.validate requires a non-null object");
    }
    return validateRule(input, {
      scope: this.scope,
      storagePath: options.storagePath,
      toggleProvider: this.toggleProvider
    });
  }
  /**
   * Transform rule JSON to JSON Formula
   * @param {Object} input - Single rule definition (has nodeName) or JCR structure (has fd:* keys)
   * @param {Object} [options]
   * @param {boolean} [options.preflight=true] -
   * Run validator before transform for AST and fd:* field input
   * @param {boolean} [options.throwOnValidationError=true] - Throw when preflight has errors
   * @param {string} [options.storagePath] - Optional storage context used by validator
   * @returns {Object} - Transformed result
   */
  transform(input, options = {}) {
    if (!input || typeof input !== "object") {
      throw new Error("RuleTransformer.transform requires a non-null object");
    }
    if (input.nodeName) {
      if (options.preflight !== false) {
        const diagnostics = this.validate(input, { storagePath: options.storagePath });
        if (options.throwOnValidationError !== false && diagnostics.errors.length > 0) {
          throw new Error(`RuleTransformer preflight validation failed with ${diagnostics.errors.length} error(s)`);
        }
      }
      const model = ModelFactory.createModel(input);
      return new JsonFormulaTransformer(this.scope, this.toggleProvider).transform(model);
    }
    return new FieldTransformer({
      scope: this.scope,
      toggleProvider: this.toggleProvider
    }).transform(input, {
      preflight: options.preflight !== false,
      throwOnValidationError: options.throwOnValidationError !== false
    });
  }
  /**
   * Validate a JSON Formula script using the @adobe/json-formula compiler.
   * @param {string} script - JSON Formula expression or AEM event script
   * @returns {{ valid: boolean, error?: string }}
   */
  static validateFormula(script) {
    if (!script || typeof script !== "string") {
      return { valid: false, error: "script must be a non-empty string" };
    }
    try {
      new JsonFormula().compile(script);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }
};

// node_modules/@aemforms/rule-editor-transformer/src/index.js
var CustomFunctionParser = __toESM(require_stub_CustomFunctionParser(), 1);

// scripts/src/validate-rule.js
function parseArgs(args) {
  const result = { rulePath: null, treePath: null, functionsPath: null, storagePath: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tree") result.treePath = args[++i];
    else if (args[i] === "--functions") result.functionsPath = args[++i];
    else if (args[i] === "--storage-path") result.storagePath = args[++i];
    else if (!args[i].startsWith("--")) result.rulePath = args[i];
  }
  return result;
}
try {
  const { rulePath, treePath, functionsPath, storagePath } = parseArgs(process.argv.slice(2));
  if (!rulePath || !treePath) {
    throw new Error("Usage: validate-rule.bundle.js <rule.json> --tree <treeJson.json> [--functions <cf.json>] [--storage-path <fd:click>]");
  }
  const ruleJson = JSON.parse((0, import_fs.readFileSync)(rulePath, "utf8"));
  const treeJson = JSON.parse((0, import_fs.readFileSync)(treePath, "utf8"));
  const customFunctions = functionsPath ? JSON.parse((0, import_fs.readFileSync)(functionsPath, "utf8")) : [];
  const scope = new RBScope(treeJson, customFunctions);
  const transformer = new RuleTransformer({ scope });
  const result = transformer.validate(ruleJson, { storagePath });
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exit(result.valid ? 0 : 1);
} catch (e) {
  process.stdout.write(JSON.stringify({ valid: false, errors: [{ code: "CLI_ERROR", message: e.message }], warnings: [] }) + "\n");
  process.exit(1);
}
