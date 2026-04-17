export function parseJudgeResponse(text, criteria) {
  let cleaned = text.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    return { results: null, parseError: 'parse failed: could not locate JSON array in judge response' };
  }
  const slice = cleaned.slice(start, end + 1);
  let arr;
  try {
    arr = JSON.parse(slice);
  } catch (err) {
    return { results: null, parseError: `parse failed: ${err.message}` };
  }
  if (!Array.isArray(arr)) return { results: null, parseError: 'parse failed: judge response is not an array' };

  const byId = new Map(arr.filter(x => x && typeof x === 'object').map(x => [x.id, x]));
  const results = criteria.map(c => {
    const entry = byId.get(c.id);
    if (!entry) {
      return { id: c.id, required: c.required !== false, passed: false, reason: 'judge returned no judgment for this criterion' };
    }
    return {
      id: c.id,
      required: c.required !== false,
      passed: Boolean(entry.passed),
      reason: String(entry.reason ?? '')
    };
  });
  return { results };
}

export async function runJudge({ provider, userMessage, transcript, criteria }) {
  const first = await provider.judge({ userMessage, transcript, criteria });
  const parsed1 = parseJudgeResponse(first.rawText ?? '', criteria);
  if (parsed1.results) return { ...parsed1, reprompted: false };

  const second = await provider.judge({ userMessage, transcript, criteria });
  const parsed2 = parseJudgeResponse(second.rawText ?? '', criteria);
  if (parsed2.results) return { ...parsed2, reprompted: true };
  return { results: null, parseError: parsed2.parseError, reprompted: true };
}
