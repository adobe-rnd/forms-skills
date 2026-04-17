import Anthropic from '@anthropic-ai/sdk';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Export it before running evals.');
  }
  return new Anthropic({ apiKey });
}

export function createAnthropicAgentProvider({ model }) {
  const client = getClient();
  return {
    async runAgentLoop({ systemPrompt, userMessage, tools, maxTurns, toolDispatch }) {
      const turns = [];
      const messages = [{ role: 'user', content: userMessage }];
      let stopReason = 'end_turn';
      for (let i = 0; i < maxTurns; i++) {
        const response = await client.messages.create({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          tools,
          messages
        });

        const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
        const textBlocks = response.content.filter(b => b.type === 'text');
        turns.push({
          role: 'assistant',
          text: textBlocks.map(b => b.text).join('\n'),
          toolCalls: toolUseBlocks.map(b => ({ id: b.id, name: b.name, input: b.input }))
        });

        messages.push({ role: 'assistant', content: response.content });

        if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
          stopReason = response.stop_reason || 'end_turn';
          break;
        }

        const toolResults = [];
        for (const tu of toolUseBlocks) {
          const result = await toolDispatch({ id: tu.id, name: tu.name, input: tu.input });
          toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: String(result) });
          turns.push({ role: 'tool_result', toolCallId: tu.id, content: String(result) });
        }
        messages.push({ role: 'user', content: toolResults });

        if (i === maxTurns - 1) stopReason = 'max_turns';
      }
      return { turns, stopReason };
    }
  };
}

export function createAnthropicJudgeProvider({ model }) {
  const client = getClient();
  return {
    async judge({ systemPrompt, userMessage, transcript, criteria }) {
      const prompt = buildJudgePrompt({ userMessage, transcript, criteria });
      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      });
      const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      return { rawText: text };
    }
  };
}

function buildJudgePrompt({ userMessage, transcript, criteria }) {
  const transcriptText = transcript.turns.map(t => {
    if (t.role === 'assistant') {
      const tc = t.toolCalls.length
        ? '\n' + t.toolCalls.map(c => `[tool_call ${c.name}] ${JSON.stringify(c.input)}`).join('\n')
        : '';
      return `ASSISTANT: ${t.text}${tc}`;
    }
    if (t.role === 'tool_result') return `TOOL_RESULT (${t.toolCallId}): ${t.content}`;
    return '';
  }).join('\n\n');

  const criteriaText = criteria.map((c, i) => `${i + 1}. [id: ${c.id}] ${c.description}`).join('\n');

  return `You are evaluating an AI agent's behavior on a task.

<user_request>
${userMessage}
</user_request>

<transcript>
${transcriptText}
</transcript>

For each criterion below, return a JSON array with entries {"id": "...", "passed": true|false, "reason": "..."}.

Criteria:
${criteriaText}

Return ONLY the JSON array. No prose, no markdown fences.`;
}
