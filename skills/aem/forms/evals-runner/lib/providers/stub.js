export function createStubAgentProvider(scriptedTurns) {
  const queue = [...scriptedTurns];
  return {
    async runAgentLoop({ systemPrompt, userMessage, tools, maxTurns, toolDispatch }) {
      const turns = [];
      let turnCount = 0;
      while (turnCount < maxTurns) {
        if (queue.length === 0) {
          return { turns, stopReason: 'end_turn' };
        }
        const scripted = queue.shift();
        turnCount++;
        if (scripted.type === 'end_turn') {
          turns.push({ role: 'assistant', text: scripted.text ?? '', toolCalls: [] });
          return { turns, stopReason: 'end_turn' };
        }
        if (scripted.type === 'tool_use') {
          turns.push({
            role: 'assistant',
            text: scripted.text ?? '',
            toolCalls: [{ id: scripted.id, name: scripted.name, input: scripted.input }]
          });
          const result = await toolDispatch({ id: scripted.id, name: scripted.name, input: scripted.input });
          turns.push({ role: 'tool_result', toolCallId: scripted.id, content: result });
        }
      }
      return { turns, stopReason: 'max_turns' };
    }
  };
}

export function createStubJudgeProvider(scriptedResponses) {
  let idx = 0;
  return {
    async judge({ systemPrompt, userMessage, transcript, criteria }) {
      const response = scriptedResponses[idx++] ?? scriptedResponses.at(-1);
      if (response.throw) throw new Error(response.throw);
      if (response.raw) return { rawText: response.raw };
      return { results: response.results };
    }
  };
}
