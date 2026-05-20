#!/usr/bin/env node
"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// lib/capi-to-pointer.js
var require_capi_to_pointer = __commonJS({
  "lib/capi-to-pointer.js"(exports2, module2) {
    "use strict";
    function capiToPointer(capiKey) {
      return capiKey.split(":").map((s) => `/items/${s}`).join("");
    }
    function capiToInsertPointer(panelCapiKey, index) {
      return capiToPointer(panelCapiKey) + `/items/${index}`;
    }
    module2.exports = { capiToPointer, capiToInsertPointer };
  }
});

// lib/resolve-insert-position-logic.js
var require_resolve_insert_position_logic = __commonJS({
  "lib/resolve-insert-position-logic.js"(exports2, module2) {
    "use strict";
    var { capiToInsertPointer } = require_capi_to_pointer();
    function navigateToCapiKey(contentModel, panelCapiKey) {
      const segments = panelCapiKey.split(":");
      let currentItems = contentModel.items;
      let current = null;
      for (let i = 0; i < segments.length; i++) {
        const builtKey = segments.slice(0, i + 1).join(":");
        current = Object.values(currentItems || {}).find((e) => e["capi-key"] === builtKey);
        if (!current) return null;
        if (i < segments.length - 1) currentItems = current.items;
      }
      return current;
    }
    function resolveStartIndex(contentModel, panelCapiKey) {
      const panel = navigateToCapiKey(contentModel, panelCapiKey);
      if (!panel) return { error: `panel not found: ${panelCapiKey}` };
      const children = panel.items ? Object.values(panel.items) : [];
      if (children.length === 0) return { nextIndex: 0, insertBefore: null };
      let maxCapiIndex = -Infinity;
      for (const child of children) {
        const idx = child["capi-index"];
        if (typeof idx === "number" && idx > maxCapiIndex) maxCapiIndex = idx;
      }
      const actionChildren = children.filter(
        (c) => /\/actions\/(submit|reset)$/.test(c.componentType || "")
      );
      if (actionChildren.length > 0) {
        const first = actionChildren.reduce(
          (prev, cur) => cur["capi-index"] < prev["capi-index"] ? cur : prev
        );
        const actionType = /\/actions\/(submit|reset)$/.exec(first.componentType)[1];
        return { nextIndex: first["capi-index"], insertBefore: actionType };
      }
      return { nextIndex: maxCapiIndex + 1, insertBefore: null };
    }
    module2.exports = { resolveStartIndex };
  }
});

// build-insert-ops.js
var { resolveStartIndex } = require_resolve_insert_position_logic();
var { capiToPointer } = require_capi_to_pointer();
var import_fs = require("fs");

// Recursively build ops for children of a newly-inserted panel.
// parentPath is the concrete JSON Pointer of the parent (no trailing '-').
// Children index from 0 since the parent is brand new and empty.
function appendChildOps(children, parentPath, ops) {
  for (let i = 0; i < children.length; i++) {
    const childPath = `${parentPath}/items/${i}`;
    ops.push({ op: "add", path: childPath, value: children[i].value });
    if (Array.isArray(children[i].children) && children[i].children.length > 0) {
      appendChildOps(children[i].children, childPath, ops);
    }
  }
}

// Build the full ops array for a nested component tree.
// components: [ { value: <component JSON>, children?: [...] }, ... ]
// targetPanelCapiKey: capi-key of the panel to insert root-level items into
// contentModel: current AEM page content model
function buildInsertOps(components, targetPanelCapiKey, contentModel) {
  const position = resolveStartIndex(contentModel, targetPanelCapiKey);
  if (position.error) return { success: false, error: position.error };

  const panelPointer = capiToPointer(targetPanelCapiKey);
  const ops = [];
  let nextIndex = position.nextIndex;

  for (const component of components) {
    const componentPath = `${panelPointer}/items/${nextIndex}`;
    ops.push({ op: "add", path: componentPath, value: component.value });
    if (Array.isArray(component.children) && component.children.length > 0) {
      appendChildOps(component.children, componentPath, ops);
    }
    nextIndex++;
  }

  return { success: true, ops };
}

// CLI
var args = process.argv.slice(2);
var get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : void 0;
};

var contentModelJson = get("--content-model");
var contentModelFile = get("--content-model-file");
var componentsJson = get("--components");
var componentsFile = get("--components-file");
var panelCapiKey = get("--panel-capi-key");

if ((!contentModelJson && !contentModelFile) || (!componentsJson && !componentsFile) || !panelCapiKey) {
  process.stderr.write(
    "Usage: node build-insert-ops.bundle.js --content-model '<json>' --components '<json>' --panel-capi-key '0'\n" +
    "       node build-insert-ops.bundle.js --content-model-file <path> --components-file <path> --panel-capi-key '0:2'\n" +
    "\n" +
    "  --content-model / --content-model-file  AEM page content model from get-aem-page-content\n" +
    "  --components / --components-file        Nested component array from forms-content-modeler:\n" +
    "                                          [ { \"value\": <component JSON>, \"children\": [...] }, ... ]\n" +
    "  --panel-capi-key                        capi-key of the target panel (e.g. '0' for root form)\n" +
    "\n" +
    "Output (success): { success: true, ops: [ { op, path, value }, ... ] }\n" +
    "Output (failure): { success: false, error: '...' }\n" +
    "Exit: 0 on success, 1 on failure, 2 on bad args\n"
  );
  process.exit(2);
}

var contentModel;
try {
  const raw = contentModelJson || import_fs.readFileSync(contentModelFile, "utf8");
  const parsed = JSON.parse(raw);
  contentModel = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
} catch (err) {
  process.stderr.write("Error: could not parse content model: " + err.message + "\n");
  process.exit(2);
}

var components;
try {
  const raw = componentsJson || import_fs.readFileSync(componentsFile, "utf8");
  components = JSON.parse(raw);
  if (!Array.isArray(components)) throw new Error("must be a JSON array");
} catch (err) {
  process.stderr.write("Error: could not parse components: " + err.message + "\n");
  process.exit(2);
}

var result = buildInsertOps(components, panelCapiKey, contentModel);
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(result.success ? 0 : 1);
