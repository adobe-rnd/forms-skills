import { createAnthropicAgentProvider, createAnthropicJudgeProvider } from './anthropic.js';
import { createBedrockAgentProvider, createBedrockJudgeProvider } from './bedrock.js';

export function getAgentProvider({ provider, model }) {
  if (provider === 'anthropic') return createAnthropicAgentProvider({ model });
  if (provider === 'bedrock') return createBedrockAgentProvider({ model });
  throw new Error(`unknown agent provider: ${provider}`);
}

export function getJudgeProvider({ provider, model }) {
  if (provider === 'anthropic') return createAnthropicJudgeProvider({ model });
  if (provider === 'bedrock') return createBedrockJudgeProvider({ model });
  throw new Error(`unknown judge provider: ${provider}`);
}
