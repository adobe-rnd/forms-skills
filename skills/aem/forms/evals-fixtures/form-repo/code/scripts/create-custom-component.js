#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--name') args.name = argv[++i];
  else if (argv[i] === '--base') args.base = argv[++i];
}
if (!args.name || !args.base) {
  console.error('usage: create-custom-component --name <view-type> --base <base-type>');
  process.exit(1);
}

const dir = path.join('blocks', 'form', 'components', args.name);
if (existsSync(dir)) {
  console.error(`component "${args.name}" already exists at ${dir}`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

const jsTemplate = `// ${args.name}.js — extends ${args.base}
export default function decorate(fieldDiv, field) {
  // TODO: implement component logic.
  // Subscribe to field changes using { listenChanges: true } when required.
  return fieldDiv;
}
`;

const cssTemplate = `/* ${args.name}.css */
`;

const jsonTemplate = JSON.stringify({
  name: args.name,
  base: args.base,
  properties: []
}, null, 2) + '\n';

writeFileSync(path.join(dir, `${args.name}.js`), jsTemplate);
writeFileSync(path.join(dir, `${args.name}.css`), cssTemplate);
writeFileSync(path.join(dir, `_${args.name}.json`), jsonTemplate);
console.log(`created component "${args.name}" extending "${args.base}" at ${dir}`);
