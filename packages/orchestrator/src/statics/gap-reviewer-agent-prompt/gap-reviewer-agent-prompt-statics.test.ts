import { gapReviewerAgentPromptStatics } from './gap-reviewer-agent-prompt-statics';

describe('gapReviewerAgentPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(gapReviewerAgentPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });
});
