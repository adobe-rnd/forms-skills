// Seed mappings file. The agent should add new fd:viewType entries to customComponents.
export const customComponents = [];

export function getCustomComponent(viewType) {
  return customComponents.find(c => c === viewType);
}
