import { gapReviewerAgentPromptStatics } from './gap-reviewer-agent-prompt-statics';

describe('gapReviewerAgentPromptStatics', () => {
  it('VALID: exported value => has expected metadata and prompt keys', () => {
    expect(gapReviewerAgentPromptStatics).toStrictEqual({
      metadata: {
        name: 'quest-gap-reviewer',
        model: 'sonnet',
        disallowedTools: ['Edit', 'Write', 'NotebookEdit'],
        color: 'orange',
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
