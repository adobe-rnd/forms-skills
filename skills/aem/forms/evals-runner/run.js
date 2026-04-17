#!/usr/bin/env node
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { loadScenarios } from './lib/load-scenarios.js';
import { resolveFixture, seedWorkspace, teardownWorkspace } from './lib/workspace.js';
import { runValidators } from './lib/validators.js';
import { runAgent } from './lib/agent-harness.js';
import { runJudge } from './lib/judge.js';
import { buildScorecard } from './lib/scorecard.js';
import { diffBaseline, approve } from './lib/baseline.js';
import { formatSummary, writeScenarioArtifacts, writeSummary } from './lib/report.js';
import { getAgentProvider, getJudgeProvider } from './lib/providers/index.js';

function parseArgs(argv) {
  const args = { skill: null, scenario: null, approve: false, noBaseline: false, filter: null, verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skill') args.skill = argv[++i];
    else if (a === '--scenario') args.scenario = argv[++i];
    else if (a === '--approve') args.approve = true;
    else if (a === '--no-baseline') args.noBaseline = true;
    else if (a === '--filter') args.filter = argv[++i];
    else if (a === '--verbose') args.verbose = true;
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
    else { console.error(`Unknown argument: ${a}`); process.exit(2); }
  }
  if (!args.skill) { console.error('Missing required --skill <path>'); process.exit(2); }
  return args;
}

function printHelp() {
  console.log(`Usage: run.js --skill <path> [options]

Options:
  --skill <path>     Path to skill directory (contains SKILL.md and evals/)
  --scenario <id>    Run only scenarios whose id contains the substring
  --filter <substr>  Alias for --scenario
  --approve          Copy current results into baseline/
  --no-baseline      Skip baseline comparison
  --verbose          Stream agent turns to stdout
  --help             Show this help
`);
}

async function loadConfig(skillDir) {
  const p = path.join(skillDir, 'evals', 'evals.config.json');
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

function resolveConfig(raw) {
  return {
    agent: {
      provider: process.env.EVAL_AGENT_PROVIDER || raw.agent?.provider || 'anthropic',
      model: process.env.EVAL_AGENT_MODEL || raw.agent?.model || 'claude-haiku-4-5-20251001',
      maxTurns: raw.agent?.maxTurns || 20
    },
    judge: {
      provider: process.env.EVAL_JUDGE_PROVIDER || raw.judge?.provider || 'anthropic',
      model: process.env.EVAL_JUDGE_MODEL || raw.judge?.model || 'claude-sonnet-4-6'
    },
    retry: {
      attempts: Number(process.env.EVAL_ATTEMPTS) || raw.retry?.attempts || 2
    },
    timeout_ms: raw.timeout_ms || 180_000
  };
}

async function runScenario({ scenario, skillDir, resultsDir, config, agentProvider, judgeProvider, verbose }) {
  const attempts = config.retry.attempts;
  const fixturePath = await resolveFixture({ skillDir, fixtureName: scenario.workspace.fixture });

  let lastCard = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const started = Date.now();
    const workspace = await seedWorkspace({ fixturePath, scenarioId: scenario.id, attempt });
    if (verbose) console.error(`[${scenario.id}] attempt ${attempt}: workspace=${workspace}`);

    let agentResult;
    try {
      agentResult = await runAgent({
        provider: agentProvider,
        skillDir,
        workspace,
        userMessage: scenario.userMessage,
        config: {
          maxTurns: Math.min(config.agent.maxTurns, scenario.agent.maxTurns),
          allowedTools: scenario.agent.allowedTools,
          mockedTools: scenario.agent.mockedTools || {}
        }
      });
    } catch (err) {
      lastCard = buildScorecard({
        scenarioId: scenario.id,
        attempts: attempt,
        duration_ms: Date.now() - started,
        validators: [{ type: 'agent_error', required: true, passed: false, reason: err.message, config: {} }],
        rubric: scenario.rubric.map(c => ({ id: c.id, required: c.required !== false, passed: false, reason: 'agent failed before judging' }))
      });
      await teardownWorkspace(workspace);
      continue;
    }

    const validators = await runValidators(workspace, scenario.validators || []);

    const judgeOut = await runJudge({
      provider: judgeProvider,
      userMessage: scenario.userMessage,
      transcript: agentResult,
      criteria: scenario.rubric
    });

    const rubric = judgeOut.results ?? scenario.rubric.map(c => ({
      id: c.id, required: c.required !== false, passed: false, reason: `judge error: ${judgeOut.parseError}`
    }));

    const card = buildScorecard({
      scenarioId: scenario.id,
      attempts: attempt,
      duration_ms: Date.now() - started,
      validators,
      rubric
    });

    await writeScenarioArtifacts({ resultsDir, scenarioId: scenario.id, transcript: agentResult, scorecard: card });
    lastCard = card;
    if (card.verdict === 'pass') {
      await teardownWorkspace(workspace);
      return card;
    }
    await teardownWorkspace(workspace);
  }
  return lastCard;
}

async function main() {
  const args = parseArgs(process.argv);
  const skillDir = path.resolve(args.skill);
  const evalsDir = path.join(skillDir, 'evals');
  const scenariosDir = path.join(evalsDir, 'scenarios');
  const baselineDir = path.join(evalsDir, 'baseline');
  const resultsDir = path.join(evalsDir, 'results');

  const rawConfig = await loadConfig(skillDir);
  const config = resolveConfig(rawConfig);

  const loaded = await loadScenarios(scenariosDir, { filter: args.filter || args.scenario });
  const valid = loaded.filter(l => l.ok);
  const invalid = loaded.filter(l => !l.ok);
  if (invalid.length) {
    console.error('Invalid scenarios:');
    for (const i of invalid) console.error(`  ${i.file}\n    - ${i.errors.join('\n    - ')}`);
    process.exit(2);
  }
  if (valid.length === 0) {
    console.error('No scenarios to run.');
    process.exit(2);
  }

  const agentProvider = getAgentProvider(config.agent);
  const judgeProvider = getJudgeProvider(config.judge);

  const cards = [];
  for (const { scenario } of valid) {
    const card = await runScenario({
      scenario, skillDir, resultsDir, config, agentProvider, judgeProvider, verbose: args.verbose
    });
    cards.push(card);
    console.error(`[${scenario.id}] ${card.verdict}`);
  }

  let diff = { regressions: [], newScenarios: [], matches: [] };
  if (!args.noBaseline) {
    diff = await diffBaseline({ baselineDir, resultsDir });
  }

  const summary = formatSummary({ skillName: path.basename(skillDir), cards, diff });
  await writeSummary({ resultsDir, summary });
  console.log(summary);

  if (args.approve) {
    const n = await approve({ baselineDir, resultsDir });
    console.error(`approved ${n} scenarios`);
  }

  const failed = cards.some(c => c.verdict === 'fail');
  if (diff.regressions.length || failed) process.exit(1);
  process.exit(0);
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(2);
});
