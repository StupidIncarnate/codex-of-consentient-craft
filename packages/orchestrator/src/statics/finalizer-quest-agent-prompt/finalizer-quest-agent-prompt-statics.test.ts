import { finalizerQuestAgentPromptStatics } from './finalizer-quest-agent-prompt-statics';

describe('finalizerQuestAgentPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(finalizerQuestAgentPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });
});
