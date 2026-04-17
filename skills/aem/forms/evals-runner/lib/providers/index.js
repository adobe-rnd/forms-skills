import { createAnthropicAgentProvider, createAnthropicJudgeProvider } from './anthropic.js';

export function getAgentProvider({ provider, model }) {
  if (provider === 'anthropic') return createAnthropicAgentProvider({ model });
  throw new Error(`unknown agent provider: ${provider}`);
}

export function getJudgeProvider({ provider, model }) {
  if (provider === 'anthropic') return createAnthropicJudgeProvider({ model });
  throw new Error(`unknown judge provider: ${provider}`);
}
