var __import_meta_url__ = require('url').pathToFileURL(__filename).href;

// src/cli/_fs.js
var import_fs = require("fs");
function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(typeof c === "string" ? c : c.toString("utf8")));
    process.stdin.on("end", () => resolve(chunks.join("")));
    process.stdin.on("error", reject);
  });
}
async function readFile(p) {
  if (p === 0) {
    return readStdin();
  }
  return import_fs.promises ? import_fs.promises.readFile(p, "utf8") : (0, import_fs.readFile)(p);
}

// src/scope/FunctionsConfig.js
function buildOOTBFunctions(toggleProvider = { isEnabled: () => false }) {
  const functions = [
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
    functions.push(
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
    functions.push({
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
    functions.push(
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
    functions.push(
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
    functions.push({
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
    functions.push({
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
  return functions;
}

// src/scope/FunctionsConfigV2.js
var V2_ALIASES = [
  {
    id: "hide",
    displayName: "Hide",
    type: "VOID",
    args: [{
      type: "ANY",
      name: "target",
      description: "target field",
      isMandatory: true
    }],
    impl: "dispatchEvent($1, 'custom:setProperty', {visible: false()})",
    description: "Hide a field."
  },
  {
    id: "show",
    displayName: "Show",
    type: "VOID",
    args: [{
      type: "ANY",
      name: "target",
      description: "target field",
      isMandatory: true
    }],
    impl: "dispatchEvent($1, 'custom:setProperty', {visible: true()})",
    description: "Show a field."
  },
  {
    id: "enable",
    displayName: "Enable",
    type: "VOID",
    args: [{
      type: "ANY",
      name: "target",
      description: "target field",
      isMandatory: true
    }],
    impl: "dispatchEvent($1, 'custom:setProperty', {enabled: true()})",
    description: "Enable a field."
  },
  {
    id: "disable",
    displayName: "Disable",
    type: "VOID",
    args: [{
      type: "ANY",
      name: "target",
      description: "target field",
      isMandatory: true
    }],
    impl: "dispatchEvent($1, 'custom:setProperty', {enabled: false()})",
    description: "Disable a field."
  },
  {
    id: "setValue",
    displayName: "Set Value",
    type: "VOID",
    args: [
      {
        type: "ANY",
        name: "target",
        description: "target field",
        isMandatory: true
      },
      {
        type: "ANY",
        name: "value",
        description: "value",
        isMandatory: true
      }
    ],
    impl: "dispatchEvent($1, 'custom:setProperty', {value: $2})",
    description: "Set a field's value."
  },
  {
    id: "setProperty",
    displayName: "Set Property",
    type: "VOID",
    args: [
      {
        type: "ANY",
        name: "target",
        description: "target field",
        isMandatory: true
      },
      {
        type: "OBJECT",
        name: "properties",
        description: "property-value map",
        isMandatory: true
      }
    ],
    impl: "dispatchEvent($1, 'custom:setProperty', $2)",
    description: "Set one or more properties on a field."
  },
  {
    id: "reset",
    displayName: "Reset",
    type: "VOID",
    // target is optional; transformer defaults missing $1 to '$form' (spec §8.3)
    args: [{
      type: "ANY",
      name: "target",
      description: "target element (form or field)",
      isMandatory: false
    }],
    impl: "dispatchEvent($1, 'reset')",
    description: "Reset a form or field."
  }
];
var V2_RUNTIME_PRIMITIVES = [
  {
    id: "dispatchEvent",
    displayName: "Dispatch Event",
    type: "VOID",
    args: [
      {
        type: "ANY",
        name: "target",
        description: "target element",
        isMandatory: true
      },
      {
        type: "STRING",
        name: "eventName",
        description: "event name",
        isMandatory: true
      },
      {
        type: "ANY",
        name: "payload",
        description: "event payload",
        isMandatory: false
      },
      {
        type: "BOOLEAN",
        name: "dispatch",
        description: "bubble to form",
        isMandatory: false
      }
    ],
    impl: "$0($1,$2,$3,$4)",
    description: "Dispatch a named event on a target element."
  },
  {
    id: "submitForm",
    displayName: "Submit Form",
    type: "VOID",
    args: [
      {
        type: "ANY",
        name: "data",
        description: "submit data",
        isMandatory: false
      },
      {
        type: "BOOLEAN",
        name: "validateForm",
        description: "validate before submit",
        isMandatory: false
      },
      {
        type: "STRING",
        name: "contentType",
        description: "content type",
        isMandatory: false
      }
    ],
    impl: "$0($1,$2,$3)",
    description: "Submit the form."
  },
  {
    id: "setFocus",
    displayName: "Set Focus",
    type: "VOID",
    args: [
      {
        type: "ANY",
        name: "target",
        description: "target field",
        isMandatory: true
      },
      {
        type: "ANY",
        name: "flag",
        description: "focus option",
        isMandatory: false
      }
    ],
    impl: "$0($1,$2)",
    description: "Set focus on a field."
  },
  {
    id: "saveForm",
    displayName: "Save Form",
    type: "VOID",
    args: [
      {
        type: "STRING",
        name: "url",
        description: "save URL",
        isMandatory: false
      }
    ],
    impl: "$0($1)",
    description: "Save the form."
  },
  {
    id: "addInstance",
    displayName: "Add Instance",
    type: "VOID",
    args: [
      {
        type: "ANY",
        name: "target",
        description: "repeatable panel",
        isMandatory: true
      },
      {
        type: "NUMBER",
        name: "index",
        description: "insertion index",
        isMandatory: false
      }
    ],
    impl: "$0($1,$2)",
    description: "Add a row to a repeatable panel."
  },
  {
    id: "removeInstance",
    displayName: "Remove Instance",
    type: "VOID",
    args: [
      {
        type: "ANY",
        name: "target",
        description: "repeatable panel",
        isMandatory: true
      },
      {
        type: "NUMBER",
        name: "index",
        description: "removal index",
        isMandatory: false
      }
    ],
    impl: "$0($1,$2)",
    description: "Remove a row from a repeatable panel."
  },
  {
    id: "exportData",
    displayName: "Export Data",
    type: "OBJECT",
    args: [],
    impl: "$0()",
    description: "Export form data as an object."
  },
  {
    id: "request",
    displayName: "Request",
    type: "VOID",
    args: [
      {
        type: "STRING",
        name: "uri",
        description: "endpoint URL",
        isMandatory: true
      },
      {
        type: "STRING",
        name: "method",
        description: "HTTP method",
        isMandatory: true
      },
      {
        type: "ANY",
        name: "payload",
        description: "request payload",
        isMandatory: false
      },
      {
        type: "ANY",
        name: "success",
        description: "success handler",
        isMandatory: false
      },
      {
        type: "ANY",
        name: "error",
        description: "error handler",
        isMandatory: false
      },
      {
        type: "OBJECT",
        name: "headers",
        description: "HTTP headers",
        isMandatory: false
      }
    ],
    impl: "$0($1,$2,$3,$4,$5,$6)",
    description: "Make an HTTP request."
  },
  {
    id: "awaitFn",
    displayName: "Await",
    type: "VOID",
    args: [
      {
        type: "ANY",
        name: "promise",
        description: "promise to await",
        isMandatory: true
      },
      {
        type: "ANY",
        name: "success",
        description: "success event name",
        isMandatory: true
      },
      {
        type: "ANY",
        name: "error",
        description: "error event name",
        isMandatory: false
      }
    ],
    impl: "$0($1,$2,$3)",
    description: "Await a promise and dispatch result as an event."
  },
  {
    id: "externalize",
    displayName: "Externalize URL",
    type: "STRING",
    args: [{
      type: "STRING",
      name: "url",
      description: "URL to externalize",
      isMandatory: true
    }],
    impl: "$0($1)",
    description: "Add context path to a URL."
  },
  {
    id: "encrypt",
    displayName: "Encrypt",
    type: "OBJECT",
    args: [
      {
        type: "OBJECT",
        name: "payload",
        description: "payload to encrypt",
        isMandatory: true
      },
      {
        type: "STRING",
        name: "publicKey",
        description: "RSA public key",
        isMandatory: false
      }
    ],
    impl: "$0($1,$2)",
    description: "Encrypt a payload (idempotent by default)."
  },
  {
    id: "decrypt",
    displayName: "Decrypt",
    type: "OBJECT",
    args: [
      {
        type: "ANY",
        name: "encryptedData",
        description: "data to decrypt",
        isMandatory: true
      },
      {
        type: "OBJECT",
        name: "originalRequest",
        description: "original request with crypto metadata",
        isMandatory: false
      }
    ],
    impl: "$0($1,$2)",
    description: "Decrypt a payload (idempotent by default)."
  }
];
var JSON_FORMULA_BUILTINS = [
  {
    id: "if",
    hidden: true,
    args: [
      { name: "condition", type: "BOOLEAN", isMandatory: true },
      { name: "thenBranch", type: "ANY", isMandatory: true },
      { name: "elseBranch", type: "ANY", isMandatory: true }
    ]
  },
  { id: "and", hidden: true },
  { id: "or", hidden: true },
  {
    id: "not",
    hidden: true,
    args: [{ name: "value", type: "ANY", isMandatory: true }]
  },
  {
    id: "map",
    hidden: true,
    args: [
      { name: "expression", type: "EXPREF", isMandatory: true },
      { name: "array", type: "ARRAY", isMandatory: true }
    ]
  },
  {
    id: "reduce",
    hidden: true,
    args: [
      { name: "expression", type: "EXPREF", isMandatory: true },
      { name: "array", type: "ARRAY", isMandatory: true },
      { name: "initial", type: "ANY", isMandatory: false }
    ]
  },
  // Boolean and null literal functions — preferred over bare identifiers which
  // compile to field lookups and silently evaluate to null when the field is absent.
  { id: "true", hidden: true, args: [] },
  { id: "false", hidden: true, args: [] },
  { id: "null", hidden: true, args: [] }
];
function buildV2Functions(toggleProvider) {
  return [
    ...buildOOTBFunctions(toggleProvider),
    ...V2_ALIASES,
    ...V2_RUNTIME_PRIMITIVES,
    ...JSON_FORMULA_BUILTINS
  ];
}

// src/scope/RBScopeBase.js
var RBScopeBase = class {
  /**
   * @param {Object} treeJson - Root node of the form/component tree.
   * @param {Array|Object} [customFunctions=[]] - Custom function list or legacy wrapper
   *   with `customFunction`.
   * @param {Array} [apiIntegrations=[]] - API integration endpoint specs from FDM cloud config.
   */
  constructor(treeJson, customFunctions = [], apiIntegrations = []) {
    if (!treeJson) {
      throw new Error("RBScopeBase requires treeJson");
    }
    const normalizedCustomFunctions = Array.isArray(customFunctions) ? customFunctions : customFunctions?.customFunction || [];
    this.treeJson = treeJson;
    this.customFunctions = normalizedCustomFunctions;
    this.variables = {};
    this.varsByType = {};
    this.components = {};
    this.functions = {};
    this.funcsByType = {};
    this.apiIntegrations = /* @__PURE__ */ new Map();
    this._initializeFromTree(treeJson);
    this._registerOOTBFunctions();
    this._registerCustomFunctions(normalizedCustomFunctions);
    this._registerApiIntegrations(apiIntegrations);
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
        path: node.path,
        fieldType: node.fieldType
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
   * Register V2 OOTB functions using a hardcoded permissive toggle provider.
   * V2 has no toggle concept — all functions are always available.
   *
   * @returns {void}
   */
  _registerOOTBFunctions() {
    const permissiveToggleProvider = { isEnabled: () => true };
    const ootbFunctions = buildV2Functions(permissiveToggleProvider);
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
   * Register API integration specs from form-level apiIntegration items.
   *
   * @param {Array<Object>} items - API integration items, each with a `confPath` and `inputJson`.
   * @returns {void}
   */
  _registerApiIntegrations(items) {
    if (!Array.isArray(items)) {
      return;
    }
    items.forEach((item) => {
      if (!item || typeof item !== "object") {
        return;
      }
      if (!item.confPath || !item.inputJson) {
        return;
      }
      try {
        const spec = typeof item.inputJson === "string" ? JSON.parse(item.inputJson) : item.inputJson;
        this.apiIntegrations.set(item.confPath, spec);
      } catch {
        console.warn(`[RBScopeBase] Skipping malformed inputJson for apiIntegration: ${item.confPath}`);
      }
    });
  }
  /**
   * @param {string} confPath - wsdlInfo.formDataModelId value from the rule
   * @returns {Object|undefined} Parsed endpoint spec, or undefined if not registered
   */
  getApiIntegration(confPath) {
    return this.apiIntegrations.get(confPath);
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
   * @public
   * @param {string} id - Component id.
   * @returns {Object|undefined}
   */
  getComponent(id) {
    return this.components[id];
  }
  /**
   * Returns the raw form tree as built by ScopeBuilder.
   * Used by the rule editor to build field dropdown items and walk the tree for chip labels.
   *
   * @returns {Object} treeJson root node
   */
  getFieldTree() {
    return this.treeJson;
  }
  /**
   * Returns all function definitions (OOTB + custom) as a flat array.
   * Each entry includes at minimum `id` and `type`; OOTB entries also carry
   * `displayName`, `args`, `description`, and `impl`.
   *
   * @returns {Array<Object>}
   */
  getFunctions() {
    return Object.values(this.functions);
  }
  /**
   * Returns the id strings of all leaf fields in the form tree.
   * A leaf is a node with a non-null fieldType that is not "panel" or "form",
   * and has no items array (or an empty one).
   *
   * @returns {string[]} e.g. ['$form.panel1.firstName', '$form.panel1.lastName']
   */
  getLeafFieldPaths() {
    const paths = [];
    const CONTAINER_TYPES = /* @__PURE__ */ new Set(["panel", "form"]);
    const collect = (node) => {
      const { fieldType, items } = node;
      const noChildren = !Array.isArray(items) || items.length === 0;
      const isLeaf = fieldType && !CONTAINER_TYPES.has(fieldType) && noChildren;
      if (isLeaf) {
        paths.push(node.id);
      }
      if (Array.isArray(items) && items.length > 0) {
        items.forEach(collect);
      }
    };
    if (Array.isArray(this.treeJson.items)) {
      this.treeJson.items.forEach(collect);
    }
    return paths;
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
   * Find a component by an exact property match.
   * `displayName` is matched case-insensitively; all other properties are exact.
   *
   * @param {string} property - 'name', 'displayName', 'path', or 'id'
   * @param {string} value
   * @returns {Object} found result or `{ found: false }`
   */
  findField(property, value) {
    const lower = value.toLowerCase();
    const match = Object.values(this.components).find((c) => {
      if (property === "displayName") {
        return (c.displayName || "").toLowerCase() === lower;
      }
      return c[property] === value;
    });
    if (!match) {
      return { found: false };
    }
    return {
      found: true,
      qualifiedId: match.id,
      name: match.name,
      type: match.type,
      displayName: match.displayName || match.name,
      fieldType: match.fieldType,
      isPanel: match.fieldType === "panel",
      ...match.options && { options: match.options }
    };
  }
  /**
   * Find components by value, tried against name → displayName → path → id.
   *
   * @param {string[]} values - Field names, display names, JCR paths, or qualified ids.
   * @returns {Array<Object>} One result per value, in the same order.
   */
  findByNames(values) {
    return values.map((value) => {
      for (const property of ["name", "displayName", "path", "id"]) {
        const result = this.findField(property, value);
        if (result.found) {
          return result;
        }
      }
      return { found: false, name: value };
    });
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

// src/cli/find-field.js
(async () => {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${[
      "Usage: find-field --tree <treeJson.json> --name <value>",
      "       find-field --tree <treeJson.json> --names <v1,v2,...>",
      "",
      "Options:",
      "  --tree    Path to treeJson produced by transform-jcr or transform-content-model",
      "  --name    Single field to look up (name, displayName, path, or qualified id)",
      "  --names   Comma-separated list of fields to look up",
      "",
      "Output (single): { found, qualifiedId, name, displayName, type, fieldType, isPanel, options? }",
      "Output (multi):  [{ name, found, ... }, ...]",
      "",
      "options: present for checkbox/checkbox-group/radio-group/drop-down fields with enum values.",
      "  Keys are runtime enum values; values are display labels.",
      "  For checkbox: keys[0] = on/checked value, keys[1] = off/unchecked value.",
      "Exit: 0 = found (all found for multi), 1 = not found, 2 = bad args"
    ].join("\n")}
`);
    process.exit(0);
  }
  const idx = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  };
  const treePath = idx("--tree");
  const name = idx("--name");
  const names = idx("--names");
  if (!treePath || !name && !names) {
    throw new Error("Usage: find-field --tree <treeJson.json> --name <field> | --names <f1,f2,...>");
  }
  const treeJson = JSON.parse(await readFile(treePath));
  const scope = new RBScopeBase(treeJson);
  if (name) {
    const result = scope.findByNames([name])[0];
    process.stdout.write(`${JSON.stringify(result)}
`);
    process.exit(result.found ? 0 : 1);
  } else {
    const nameList = names.split(",").map((n) => n.trim()).filter(Boolean);
    const results = scope.findByNames(nameList);
    process.stdout.write(`${JSON.stringify(results)}
`);
    process.exit(results.every((r) => r.found) ? 0 : 1);
  }
})().catch((e) => {
  process.stdout.write(`${JSON.stringify({ found: false, error: e.message })}
`);
  process.exit(2);
});
