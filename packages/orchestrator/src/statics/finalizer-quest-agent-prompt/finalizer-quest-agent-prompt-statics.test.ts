import { finalizerQuestAgentPromptStatics } from './finalizer-quest-agent-prompt-statics';

describe('finalizerQuestAgentPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(finalizerQuestAgentPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(finalizerQuestAgentPromptStatics.prompt)).toStrictEqual([
      'template',
      'placeholders',
    ]);
    expect(typeof finalizerQuestAgentPromptStatics.prompt.template).toBe('string');
    expect(finalizerQuestAgentPromptStatics.prompt.template.length).toBeGreaterThan(0);
    expect(finalizerQuestAgentPromptStatics.prompt.placeholders).toStrictEqual({
      arguments: '$ARGUMENTS',
    });
  });
});
