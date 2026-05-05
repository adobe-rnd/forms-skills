// Build script — bundles CLI tools for offline use (no npm install required at runtime).
//
// forms-rule-creator/scripts/ output:
//   content-model-to-tree.bundle.js  — content model → treeJson (replaces aemf-transform-jcr)
//   validate-rule.bundle.js          — rule AST validator       (wraps aemf-validate-rule)
//   generate-formula.bundle.js       — rule AST → JSON Formula  (wraps aemf-generate-formula)
//   parse-functions.bundle.js        — custom function parser   (wraps aemf-parse-functions)
//
// forms-content-update/scripts/ output:
//   find-field.bundle.js             — find field by name → capiKey + pointer + qualifiedId + type
//   find-rule-refs.bundle.js         — scan fd:rules ASTs for COMPONENT refs to a qualifiedId
//   rewrite-rule-refs.bundle.js      — rewrite COMPONENT refs old→new in fd:rules ASTs
//
// All scripts share forms-shared/scripts/content-model-walk.js (inlined by esbuild — no runtime dependency).
//
// Usage:
//   node build.mjs
//
// Requires: npm install (devDependencies: @aemforms/rule-editor-transformer, esbuild)

import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// @aemforms/rule-editor-transformer re-exports CustomFunctionParser as a namespace,
// which esbuild cannot tree-shake. CustomFunctionParser reads vendor files at module
// init time, so any bundle that includes it must have vendor/ next to it at runtime.
// For bundles that don't use CustomFunctionParser at all, stub it out entirely.
const stubCustomFunctionParser = {
  name: 'stub-custom-function-parser',
  setup(build) {
    build.onResolve({ filter: /CustomFunctionParser/ }, () => ({
      path: 'stub:CustomFunctionParser',
      namespace: 'stub',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'module.exports = {};',
      loader: 'js',
    }));
  },
};

const __dirname = dirname(fileURLToPath(import.meta.url));

const rootDir          = join(__dirname, '..');
const scriptsDir       = join(__dirname, 'scripts');
const pkgCli           = join(__dirname, 'node_modules/@aemforms/rule-editor-transformer/src/cli');
const formUpdateScripts = join(rootDir, 'forms-content-author/forms-content-update/scripts');
const formUpdateSrc    = join(formUpdateScripts, 'src');

const entries = [
  // ── forms-rule-creator ────────────────────────────────────────────────────
  // Our source wrappers — use @aemforms/rule-editor-transformer
  { in: join(__dirname, 'scripts/src/content-model-to-tree.js'), out: join(scriptsDir, 'content-model-to-tree.bundle.js') },
  { in: join(__dirname, 'scripts/src/validate-rule.js'),         out: join(scriptsDir, 'validate-rule.bundle.js') },
  { in: join(__dirname, 'scripts/src/generate-formula.js'),      out: join(scriptsDir, 'generate-formula.bundle.js') },
  { in: join(__dirname, 'scripts/src/validate-merge.js'),        out: join(scriptsDir, 'validate-merge.bundle.js') },
  // parse-functions bundles the upstream CLI directly and intentionally includes
  // CustomFunctionParser (which reads vendor/ at runtime — vendor/ must exist next to bundle).
  { in: join(pkgCli, 'parse-functions.js'), out: join(scriptsDir, 'parse-functions.bundle.js'), keepCustomFunctionParser: true },

  // ── forms-content-update ─────────────────────────────────────────────────
  // forms-shared/scripts/content-model-walk.js is inlined into each bundle by esbuild — no runtime dependency
  { in: join(formUpdateSrc, 'apply-rule-patch.js'),  out: join(formUpdateScripts, 'apply-rule-patch.bundle.js') },
  { in: join(formUpdateSrc, 'find-field.js'),        out: join(formUpdateScripts, 'find-field.bundle.js') },
  { in: join(formUpdateSrc, 'find-rule-refs.js'),    out: join(formUpdateScripts, 'find-rule-refs.bundle.js') },
  { in: join(formUpdateSrc, 'rewrite-rule-refs.js'), out: join(formUpdateScripts, 'rewrite-rule-refs.bundle.js') },
];

// forms-content-update scripts live outside forms-rule-creator/ so esbuild can't
// find node_modules via normal traversal — add forms-rule-creator/node_modules explicitly.
const sharedNodeModules = join(__dirname, 'node_modules');

for (const { in: entryPoint, out: outfile, keepCustomFunctionParser } of entries) {
  await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    nodePaths: [sharedNodeModules],
    logLevel: 'info',
    // import.meta.url is undefined in esbuild CJS bundles (esbuild emits `var import_meta = {}`).
    // Replace every import.meta.url occurrence with __import_meta_url__ (banner-defined) so that
    // bundled ESM modules (e.g. CustomFunctionParser resolving vendor/ paths) work correctly.
    define: { 'import.meta.url': '__import_meta_url__' },
    banner: { js: "var __import_meta_url__ = require('url').pathToFileURL(__filename).href;" },
    // Stub out CustomFunctionParser for every bundle that doesn't use it. The transformer's
    // main entry re-exports it as a namespace (export * as CustomFunctionParser), which esbuild
    // can't tree-shake. CustomFunctionParser reads vendor/ files at init time, so including it
    // in bundles that don't need it would require vendor/ to exist next to every bundle.
    plugins: keepCustomFunctionParser ? [] : [stubCustomFunctionParser],
  });
}

console.log('\nDone — 9 bundles written (5 forms-rule-creator, 4 forms-content-update)');
