import { gapReviewerAgentPromptStatics } from './gap-reviewer-agent-prompt-statics';

describe('gapReviewerAgentPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(Object.keys(gapReviewerAgentPromptStatics)).toStrictEqual(['prompt']);
    expect(Object.keys(gapReviewerAgentPromptStatics.prompt)).toStrictEqual([
      'template',
      'placeholders',
    ]);
    expect(typeof gapReviewerAgentPromptStatics.prompt.template).toBe('string');
    expect(gapReviewerAgentPromptStatics.prompt.template.length).toBeGreaterThan(0);
    expect(gapReviewerAgentPromptStatics.prompt.placeholders).toStrictEqual({
      arguments: '$ARGUMENTS',
    });
  });
});
