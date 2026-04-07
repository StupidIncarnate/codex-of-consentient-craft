import { finalizerQuestAgentPromptStatics } from './finalizer-quest-agent-prompt-statics';

describe('finalizerQuestAgentPromptStatics', () => {
  it('VALID: exported value => has expected metadata and prompt keys', () => {
    expect(finalizerQuestAgentPromptStatics).toStrictEqual({
      metadata: {
        name: 'finalizer-quest-agent',
        model: 'sonnet',
        disallowedTools: ['Edit', 'Write', 'NotebookEdit'],
        color: 'green',
      },
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });
});
