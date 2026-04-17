export function buildScorecard({ scenarioId, attempts, duration_ms, validators, rubric }) {
  const requiredFailures = [];
  for (const v of validators) {
    if (v.required && !v.passed) {
      const label = v.name || `${v.type}(${describeConfig(v.config)})`;
      requiredFailures.push(`validator:${label} — ${v.reason}`);
    }
  }
  for (const r of rubric) {
    if (r.required && !r.passed) {
      requiredFailures.push(`rubric:${r.id} — ${r.reason}`);
    }
  }
  return {
    scenarioId,
    attempts,
    verdict: requiredFailures.length === 0 ? 'pass' : 'fail',
    duration_ms,
    validators,
    rubric,
    requiredFailures
  };
}

function describeConfig(cfg) {
  if (!cfg) return '';
  if (cfg.path) return cfg.path;
  if (cfg.command) return cfg.command;
  return '';
}
