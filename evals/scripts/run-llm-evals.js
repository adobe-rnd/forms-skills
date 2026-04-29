#!/usr/bin/env node
/**
 * LLM eval runner for forms-content-authoring skill.
 *
 * Runs agentic loop scenarios against the skill system prompt using mock MCP
 * tool responses. A judge LLM evaluates the captured transcript against each
 * scenario's rubric criteria and reports pass/fail.
 *
 * Auth (auto-detected, first match wins):
 *   1. ANTHROPIC_API_KEY        → direct Anthropic API (local dev)
 *   2. AWS_BEARER_TOKEN_BEDROCK → Bedrock bearer token
 *   3. AWS credentials in env / ~/.aws → Bedrock SigV4 (CI with OIDC role)
 *
 * Usage:
 *   node evals/scripts/run-llm-evals.js
 *   node evals/scripts/run-llm-evals.js --filter routing
 *   node evals/scripts/run-llm-evals.js --verbose
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ─── Config ───────────────────────────────────────────────────────────────────

const SKILL_DIR = path.resolve(__dirname, '../..');
const SCENARIOS_DIR = path.resolve(__dirname, '../scenarios');
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

// Skill SKILL.md paths — read at runtime from source, never a copy
const SKILL_MD_PATHS = [
  path.join(SKILL_DIR, 'SKILL.md'),
  path.join(SKILL_DIR, 'forms-content-update/SKILL.md'),
  path.join(SKILL_DIR, 'forms-content-generate/SKILL.md'),
  path.join(SKILL_DIR, 'forms-rule-creator/SKILL.md'),
];

const MAX_AGENT_TURNS = 28;

// LLM outputs are stochastic. A scenario must fail on ALL attempts to be marked failed.
// Default 2: pass on any single run → PASS. Override with EVAL_ATTEMPTS=3 for stricter CI.
const EVAL_ATTEMPTS = parseInt(process.env.EVAL_ATTEMPTS || '2', 10);

const filterArg = process.argv.includes('--filter')
  ? process.argv[process.argv.indexOf('--filter') + 1]
  : null;
const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

// ─── Client + model selection ─────────────────────────────────────────────────
// Auto-detects auth:
//   ANTHROPIC_API_KEY set          → direct Anthropic API  (local dev)
//   AWS_BEARER_TOKEN_BEDROCK set   → Bedrock bearer token
//   neither                        → Bedrock SigV4 via credential chain (CI)

let client;
let AGENT_MODEL;
let JUDGE_MODEL;

if (process.env.ANTHROPIC_API_KEY) {
  const { default: Anthropic } = require('@anthropic-ai/sdk');
  client = new Anthropic();
  AGENT_MODEL = process.env.EVAL_AGENT_MODEL || 'claude-haiku-4-5-20251001';
  JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL  || 'claude-sonnet-4-6';
  if (verbose) console.log('auth: ANTHROPIC_API_KEY → direct API');
} else {
  const { AnthropicBedrock } = require('@anthropic-ai/bedrock-sdk');
  const bedrockOpts = { awsRegion: process.env.AWS_REGION || 'us-east-1' };
  if (process.env.AWS_BEARER_TOKEN_BEDROCK) bedrockOpts.awsBearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  client = new AnthropicBedrock(bedrockOpts);
  AGENT_MODEL = process.env.EVAL_AGENT_MODEL || 'us.anthropic.claude-3-5-haiku-20241022-v1:0';
  JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL  || 'us.anthropic.claude-3-5-haiku-20241022-v1:0';
  if (verbose) console.log('auth: Bedrock (' + (process.env.AWS_BEARER_TOKEN_BEDROCK ? 'bearer token' : 'SigV4') + ')');
}

// ─── System prompt ────────────────────────────────────────────────────────────
// Front-loads all knowledge-base and reference files so the agent has the same
// information it would get from Read tool calls in a real Claude Code session.

function buildSystemPrompt() {
  const skillContent = SKILL_MD_PATHS
    .map(p => {
      if (!fs.existsSync(p)) throw new Error(`SKILL.md not found: ${p}`);
      return fs.readFileSync(p, 'utf8');
    })
    .join('\n\n---\n\n');

  return skillContent;
}

// ─── File tool implementations ────────────────────────────────────────────────
// Mirror Claude Code's Read/Write/Glob/Grep tools so the model can load
// grammar files, agent-kb articles, and temp files on demand — exactly as it
// would in a real Claude Code session.

function expandPath(p) {
  if (!p) return p;
  return p.replace(/\$SKILL_DIR/g, SKILL_DIR);
}

function fileToolRead(input) {
  const filePath = expandPath(input.file_path);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const offset = input.offset || 0;
    const limit = input.limit;
    const slice = limit ? lines.slice(offset, offset + limit) : lines.slice(offset);
    return slice.map((l, i) => `${offset + i + 1}\t${l}`).join('\n');
  } catch (err) {
    return JSON.stringify({ error: `Cannot read file: ${err.message}` });
  }
}

function fileToolWrite(input) {
  const filePath = expandPath(input.file_path);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, input.content || '', 'utf8');
    return `File written: ${filePath}`;
  } catch (err) {
    return JSON.stringify({ error: `Cannot write file: ${err.message}` });
  }
}

function fileToolGlob(input) {
  const searchPath = expandPath(input.path) || SKILL_DIR;
  const pattern = input.pattern || '**/*';
  try {
    const result = spawnSync('find', [searchPath, '-name', pattern.replace(/\*\*\//g, '').replace(/\*/g, '*')], { encoding: 'utf8', timeout: 10000 });
    // Use a simple shell glob via bash instead
    const cmd = `cd ${JSON.stringify(searchPath)} && find . -path ${JSON.stringify('./' + pattern.replace(/\*\*/g, '**'))} 2>/dev/null | head -50`;
    const out = execSync(`bash -c ${JSON.stringify(cmd)}`, { timeout: 10000 }).toString().trim();
    const files = out.split('\n').filter(Boolean).map(f => path.join(searchPath, f.replace(/^\.\//, '')));
    return JSON.stringify(files);
  } catch (err) {
    return JSON.stringify({ error: err.message });
  }
}

function fileToolGrep(input) {
  const searchPath = expandPath(input.path) || SKILL_DIR;
  const glob = input.glob || '**/*';
  try {
    const cmd = `grep -r --include="${glob.replace(/\*\*\//g, '')}" -l ${JSON.stringify(input.pattern)} ${JSON.stringify(searchPath)} 2>/dev/null | head -20`;
    const out = execSync(`bash -c ${JSON.stringify(cmd)}`, { timeout: 10000 }).toString().trim();
    return out || '(no matches)';
  } catch (err) {
    return '(no matches)';
  }
}

// ─── MCP tool declarations ────────────────────────────────────────────────────

const MCP_TOOLS = [
  // ── File tools (match Claude Code's Read/Write/Glob/Grep interface) ──────────
  {
    name: 'Read',
    description: 'Read a file from the local filesystem. Use $SKILL_DIR to reference skill files (e.g. $SKILL_DIR/forms-rule-creator/grammar/visibility-expressions.md).',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Absolute path. $SKILL_DIR is expanded automatically.' },
        offset: { type: 'number', description: 'Line number to start reading from (0-indexed)' },
        limit: { type: 'number', description: 'Max number of lines to read' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'Write',
    description: 'Write content to a file. Creates parent directories as needed.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Absolute path to write to.' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['file_path', 'content'],
    },
  },
  {
    name: 'Glob',
    description: 'Find files matching a glob pattern.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern (e.g. "*.md", "**/*.json")' },
        path: { type: 'string', description: 'Directory to search in. Defaults to $SKILL_DIR.' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'Grep',
    description: 'Search file contents for a pattern.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex or string to search for' },
        path: { type: 'string', description: 'Directory or file to search in' },
        glob: { type: 'string', description: 'File glob filter (e.g. "*.md")' },
      },
      required: ['pattern'],
    },
  },
  // ── AEM Sites Content MCP tools (mocked via fixture responses) ───────────────
  {
    name: 'get-aem-sites',
    description: 'Lists all AEM sites available on this instance.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get-aem-pages',
    description: 'Lists pages in an AEM site. Pass publishPath to filter by path prefix.',
    input_schema: {
      type: 'object',
      properties: {
        publishPath: { type: 'string', description: 'JCR path prefix to filter pages' },
        siteId: { type: 'string', description: 'Site ID' },
      },
      required: [],
    },
  },
  {
    name: 'get-aem-page-content',
    description: 'Returns the content model (JCR content) of an AEM page by pageId.',
    input_schema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'The pageId of the AEM page' },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'get-aem-page-content-definition',
    description: 'Returns the component definition for a given pageId.',
    input_schema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'The pageId of the AEM page' },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'patch-aem-page-content',
    description: 'Applies a JSON Patch to the content model of an AEM page.',
    input_schema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'The pageId of the AEM page' },
        patch: { type: 'array', description: 'JSON Patch array (RFC 6902)' },
        eTag: { type: 'string', description: 'ETag from get-aem-page-content for optimistic locking' },
      },
      required: ['pageId', 'patch', 'eTag'],
    },
  },
  {
    name: 'bash',
    description: 'Execute a shell command. Use this to run bundled node scripts from $SKILL_DIR (e.g. find-field.bundle.js, content-model-to-tree.bundle.js, validate-rule.bundle.js). $SKILL_DIR is expanded to the skill root.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute. $SKILL_DIR is expanded to the skill root.' },
        description: { type: 'string', description: 'Brief description of what this command does' },
      },
      required: ['command'],
    },
  },
];

// ─── Bash execution ───────────────────────────────────────────────────────────
// Executes shell commands for bundled scripts. $SKILL_DIR is replaced with the
// actual skill root path. Returns stdout on success or a JSON error on failure.

function executeBashCommand(command) {
  if (!command) return JSON.stringify({ error: 'No command provided' });

  // Expand $SKILL_DIR to the real path
  const cmd = command.replace(/\$SKILL_DIR/g, SKILL_DIR);

  try {
    const output = execSync(cmd, {
      cwd: SKILL_DIR,
      timeout: 30000,
      env: { ...process.env, SKILL_DIR },
    }).toString();
    return output || '(no output)';
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    const stdout = err.stdout?.toString() || '';
    return JSON.stringify({ error: err.message, stderr, stdout, exitCode: err.status });
  }
}

// ─── Scenario discovery ───────────────────────────────────────────────────────

function findScenarios(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findScenarios(full));
    else if (entry.name.endsWith('.json')) {
      try {
        const s = JSON.parse(fs.readFileSync(full, 'utf8'));
        if (s.type === 'llm') results.push(full);
      } catch (_) {}
    }
  }
  return results.sort();
}

// ─── Fixture resolution ───────────────────────────────────────────────────────

function resolveFixture(value) {
  if (typeof value !== 'string') return value;
  if (value.startsWith('@fixtures/')) {
    const p = path.join(FIXTURES_DIR, value.slice('@fixtures/'.length));
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  if (value.startsWith('fixture:')) {
    const p = path.join(FIXTURES_DIR, value.slice('fixture:'.length));
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return value;
}

function resolveToolResponses(toolResponses) {
  const resolved = {};
  for (const [toolName, resp] of Object.entries(toolResponses || {})) {
    resolved[toolName] = resolveFixture(resp);
  }
  return resolved;
}

// ─── Agentic loop ─────────────────────────────────────────────────────────────
// Runs the model with the skill system prompt and mock MCP tool responses.
// Returns the full transcript (array of messages).

async function runAgentLoop(systemPrompt, userMessage, toolResponses) {
  const messages = [{ role: 'user', content: userMessage }];
  const transcript = [];

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    const response = await client.messages.create({
      model: AGENT_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: MCP_TOOLS,
      messages,
    });

    transcript.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') break;
    if (response.stop_reason !== 'tool_use') break;

    // Collect all tool_use blocks
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    if (toolUseBlocks.length === 0) break;

    // Build tool_result message
    const toolResults = toolUseBlocks.map(block => {
      let resultContent;

      if (block.name === 'bash') {
        // Actually execute shell commands (scripts are pre-bundled, no npm install needed)
        resultContent = executeBashCommand(block.input.command);
      } else if (block.name === 'Read') {
        resultContent = fileToolRead(block.input);
      } else if (block.name === 'Write') {
        resultContent = fileToolWrite(block.input);
      } else if (block.name === 'Glob') {
        resultContent = fileToolGlob(block.input);
      } else if (block.name === 'Grep') {
        resultContent = fileToolGrep(block.input);
      } else {
        const mockResp = toolResponses[block.name];
        resultContent = mockResp !== undefined
          ? JSON.stringify(mockResp)
          : JSON.stringify({ error: `No mock response configured for tool: ${block.name}` });
      }

      if (verbose) {
        console.log(`    tool_use: ${block.name}(${JSON.stringify(block.input).slice(0, 80)})`);
        console.log(`    tool_result: ${resultContent.slice(0, 80)}`);
      }

      return {
        type: 'tool_result',
        tool_use_id: block.id,
        content: resultContent,
      };
    });

    // Push assistant + tool_results into messages
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    // Prevent double-adding the last assistant turn at top of loop
    transcript.pop();
    transcript.push({ role: 'assistant', content: response.content });
  }

  return transcript;
}

// ─── Judge evaluation ─────────────────────────────────────────────────────────
// Asks a judge LLM to evaluate the transcript against each rubric criterion.
// Returns array of { id, passed, reason }.

async function judgeTranscript(transcript, rubric, userMessage) {
  const transcriptText = transcript
    .map(t => {
      if (typeof t.content === 'string') return `${t.role}: ${t.content}`;
      if (Array.isArray(t.content)) {
        return t.content.map(b => {
          if (b.type === 'text') return `${t.role}: ${b.text}`;
          if (b.type === 'tool_use') return `${t.role} [tool_use]: ${b.name}(${JSON.stringify(b.input)})`;
          if (b.type === 'tool_result') return `tool_result: ${b.content}`;
          return `${t.role}: [${b.type}]`;
        }).join('\n');
      }
      return `${t.role}: ${JSON.stringify(t.content)}`;
    })
    .join('\n\n');

  const rubricText = rubric
    .map((r, i) => `${i + 1}. [${r.id}] ${r.description}`)
    .join('\n');

  const prompt = `You are evaluating whether an AI assistant correctly followed a skill workflow.

## User Message
${userMessage}

## Transcript
${transcriptText}

## Rubric Criteria
Evaluate each criterion below. For each, respond with PASS or FAIL and a brief reason (1 sentence).

${rubricText}

## Response Format
You MUST respond with ONLY a JSON array — no prose, no preamble, no explanation outside the array.
Even if you are uncertain or the transcript is incomplete, always return the JSON array with passed: false and a brief reason.
[
  { "id": "<criterion id>", "passed": true|false, "reason": "<one sentence>" },
  ...
]`;

  const response = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content.find(b => b.type === 'text')?.text || '[]';
  try {
    // Strip markdown code block if present
    const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (_) {
    return rubric.map(r => ({ id: r.id, passed: false, reason: `Judge parse error: ${text.slice(0, 80)}` }));
  }
}

// ─── Scenario runner ──────────────────────────────────────────────────────────

// Temp files that may be written by model scripts during a scenario run.
// Clean up before each scenario to prevent cross-scenario contamination.
// NOTE: SKILL.md bash commands hardcode /tmp (not os.tmpdir(), which on macOS
// returns /var/folders/... — a different location). Must match what the model writes.
const TMP_FILES_TO_CLEAN = [
  '/tmp/definition.json', '/tmp/content-model.json', '/tmp/ff-result.json', '/tmp/find-field-result.json',
  '/tmp/merged-rule.json', '/tmp/rule.json', '/tmp/treeJson.json',
  '/tmp/rule-patch.json', '/tmp/customFunctions.json', '/tmp/rewritten-rule.json',
];

function cleanTmpFiles() {
  for (const f of TMP_FILES_TO_CLEAN) {
    try { fs.unlinkSync(f); } catch (_) {}
  }
}

async function runScenario(file, systemPrompt) {
  cleanTmpFiles();  // prevent cross-scenario temp file contamination

  const scenario = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { id, description, userMessage, toolResponses: rawToolResponses, rubric } = scenario;

  if (!userMessage) return { passed: false, error: 'Missing userMessage' };
  if (!rubric || rubric.length === 0) return { passed: false, error: 'Missing rubric' };

  const toolResponses = resolveToolResponses(rawToolResponses || {});

  // Pre-populate /tmp/content-model.json from the get-aem-page-content fixture so
  // scripts that use --content-model-file work even if the model's Write is truncated.
  const pageContentResp = toolResponses['get-aem-page-content'];
  if (pageContentResp) {
    try {
      const parsed = typeof pageContentResp === 'string' ? JSON.parse(pageContentResp) : pageContentResp;
      if (parsed.data) {
        fs.writeFileSync('/tmp/content-model.json', JSON.stringify(parsed.data), 'utf8');
      }
    } catch (_) {}
  }

  let transcript;
  try {
    transcript = await runAgentLoop(systemPrompt, userMessage, toolResponses);
  } catch (err) {
    return { passed: false, error: `Agent loop error: ${err.message}` };
  }

  let judgement;
  try {
    judgement = await judgeTranscript(transcript, rubric, userMessage);
  } catch (err) {
    return { passed: false, error: `Judge error: ${err.message}` };
  }

  // Map judgement array back to rubric order
  const results = rubric.map(r => {
    const j = judgement.find(j => j.id === r.id);
    return j || { id: r.id, passed: false, reason: 'Not evaluated by judge' };
  });

  const requiredFailed = results.filter((r, i) => {
    const criterion = rubric[i];
    return criterion.required !== false && !r.passed;
  });

  return {
    passed: requiredFailed.length === 0,
    description,
    criteria: results,
    transcript: verbose ? transcript : undefined,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const allScenarios = findScenarios(SCENARIOS_DIR).filter(f =>
    !filterArg || f.includes(filterArg)
  );

  if (allScenarios.length === 0) {
    console.error('No LLM scenarios found' + (filterArg ? ` matching "${filterArg}"` : ''));
    process.exit(1);
  }

  let systemPrompt;
  try {
    systemPrompt = buildSystemPrompt();
  } catch (err) {
    console.error(`Failed to load system prompt: ${err.message}`);
    process.exit(1);
  }

  console.log(`\nRunning ${allScenarios.length} LLM eval(s)...\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const file of allScenarios) {
    const rel = path.relative(SCENARIOS_DIR, file);
    process.stdout.write(`  ⋯  ${rel}\r`);

    // Run up to EVAL_ATTEMPTS times. Pass on first success (optimistic).
    let result;
    for (let attempt = 0; attempt < EVAL_ATTEMPTS; attempt++) {
      result = await runScenario(file, systemPrompt);
      if (result.passed) break;
      if (attempt < EVAL_ATTEMPTS - 1 && verbose) {
        console.log(`       [attempt ${attempt + 1}/${EVAL_ATTEMPTS} failed, retrying...]`);
      }
    }

    if (result.passed) {
      passed++;
      console.log(`  \x1b[32m✓\x1b[0m  ${rel}`);
    } else {
      failed++;
      console.log(`  \x1b[31m✗\x1b[0m  ${rel}`);
      failures.push({ rel, result });
    }

    // Per-criterion detail
    if (result.criteria) {
      for (const c of result.criteria) {
        const sym = c.passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
        console.log(`       ${sym}  [${c.id}]  ${c.reason}`);
      }
    }
  }

  if (failures.length > 0) {
    console.log('\nFailures:\n');
    for (const { rel, result } of failures) {
      console.log(`  ${rel}  —  ${result.description || ''}`);
      if (result.error) console.log(`    error: ${result.error}`);
    }
  }

  const total = passed + failed;
  const colour = failed > 0 ? '\x1b[31m' : '\x1b[32m';
  console.log(`\n${colour}${passed}/${total} passed\x1b[0m\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
