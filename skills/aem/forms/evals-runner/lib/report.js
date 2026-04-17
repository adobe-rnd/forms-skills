import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export function formatSummary({ skillName, cards, diff }) {
  const lines = [];
  lines.push(`# Evals summary: ${skillName}`);
  lines.push('');
  lines.push(`| Scenario | Verdict | Attempts | Duration |`);
  lines.push(`|---|---|---|---|`);
  for (const card of cards) {
    lines.push(`| ${card.scenarioId} | ${verdictBadge(card.verdict)} | ${card.attempts} | ${ms(card.duration_ms)} |`);
  }
  lines.push('');

  if (diff.regressions.length) {
    lines.push(`## Regressions vs baseline (${diff.regressions.length})`);
    for (const r of diff.regressions) {
      lines.push(`- **${r.scenarioId}** — ${r.reason}`);
    }
    lines.push('');
  } else {
    lines.push(`## No regressions detected.`);
    lines.push('');
  }

  if (diff.newScenarios.length) {
    lines.push(`## New scenarios (not in baseline)`);
    for (const id of diff.newScenarios) lines.push(`- ${id}`);
    lines.push('');
  }

  for (const card of cards.filter(c => c.verdict === 'fail')) {
    lines.push(`## Failed scenario: ${card.scenarioId}`);
    for (const f of card.requiredFailures) lines.push(`- ${f}`);
    lines.push('');
  }

  return lines.join('\n');
}

function verdictBadge(v) {
  return v === 'pass' ? '✅ pass' : '❌ fail';
}

function ms(n) {
  if (!n && n !== 0) return '-';
  if (n < 1000) return `${n}ms`;
  return `${(n / 1000).toFixed(1)}s`;
}

export async function writeScenarioArtifacts({ resultsDir, scenarioId, transcript, scorecard }) {
  const dir = path.join(resultsDir, scenarioId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'run.json'), JSON.stringify(transcript, null, 2));
  await writeFile(path.join(dir, 'score.json'), JSON.stringify(scorecard, null, 2));
  await writeFile(path.join(dir, 'report.md'), formatScenarioReport(scorecard));
}

function formatScenarioReport(card) {
  const lines = [];
  lines.push(`# ${card.scenarioId} — ${card.verdict === 'pass' ? '✅ pass' : '❌ fail'}`);
  lines.push('');
  lines.push('## Validators');
  for (const v of card.validators) {
    const icon = v.passed ? '✅' : (v.required ? '❌' : '⚠️');
    const label = v.name || `${v.type}(${v.config?.path || v.config?.command || ''})`;
    lines.push(`- ${icon} ${label} — ${v.reason}`);
  }
  lines.push('');
  lines.push('## Rubric');
  for (const r of card.rubric) {
    const icon = r.passed ? '✅' : (r.required ? '❌' : '⚠️');
    lines.push(`- ${icon} ${r.id} — ${r.reason}`);
  }
  return lines.join('\n');
}

export async function writeSummary({ resultsDir, summary }) {
  await mkdir(resultsDir, { recursive: true });
  await writeFile(path.join(resultsDir, 'summary.md'), summary);
}
