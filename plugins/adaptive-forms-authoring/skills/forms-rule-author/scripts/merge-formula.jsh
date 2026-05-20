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

// src/cli/merge-formula.js
var ALLOWED_VALIDATION_STATUSES = /* @__PURE__ */ new Set(["valid", "invalid"]);
(async () => {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${[
      "Usage: merge-formula <generate-formula-output.json>",
      "",
      "Input:  JSON produced by generate-formula:",
      "        { input, fdRules, fdEvents, formulaValid, validationStatus? }",
      '        validationStatus is optional \u2014 "valid" | "invalid" \u2014 written to fd:rules.validationStatus.',
      'Output: { "fd:rules": {...}, "fd:events": {...} }',
      "Exit:   0 on success, 1 on error"
    ].join("\n")}
`);
    process.exit(0);
  }
  if (args.length === 0) {
    throw new Error("Usage: merge-formula <generate-formula-output.json>");
  }
  const raw = JSON.parse(await readFile(args[0]));
  if (!raw.formulaValid) {
    throw new Error("generate-formula output has formulaValid:false \u2014 fix the formula before merging");
  }
  const fdRules = { ...raw.input, ...raw.fdRules };
  if (raw.validationStatus !== void 0) {
    if (!ALLOWED_VALIDATION_STATUSES.has(raw.validationStatus)) {
      throw new Error(`invalid validationStatus "${raw.validationStatus}" \u2014 must be "valid" or "invalid"`);
    }
    fdRules.validationStatus = raw.validationStatus;
  }
  const fdEvents = raw.fdEvents || {};
  const finalOutput = {};
  if (raw.validationExpression != null) {
    finalOutput.validationExpression = raw.validationExpression;
  }
  if (raw.displayValueExpression != null) {
    finalOutput.displayValueExpression = raw.displayValueExpression;
  }
  finalOutput["fd:rules"] = fdRules;
  finalOutput["fd:events"] = fdEvents;
  process.stdout.write(`${JSON.stringify(finalOutput)}
`);
  process.exit(0);
})().catch((e) => {
  process.stdout.write(`${JSON.stringify({ error: e.message })}
`);
  process.exit(1);
});
