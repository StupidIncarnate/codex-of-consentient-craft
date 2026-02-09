import { gapReviewerAgentPromptStatics } from './gap-reviewer-agent-prompt-statics';

describe('gapReviewerAgentPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: template => contains gap reviewer agent identity', () => {
      expect(gapReviewerAgentPromptStatics.prompt.template).toMatch(
        /^---\nname: quest-gap-reviewer/u,
      );
    });

    it('VALID: template => contains Staff Engineer role', () => {
      expect(gapReviewerAgentPromptStatics.prompt.template).toMatch(/Staff Engineer/u);
    });

    it('VALID: template => contains review process steps', () => {
      expect(gapReviewerAgentPromptStatics.prompt.template).toMatch(/Review Requirements/u);
      expect(gapReviewerAgentPromptStatics.prompt.template).toMatch(/Review Observables/u);
      expect(gapReviewerAgentPromptStatics.prompt.template).toMatch(/Check for Logic Gaps/u);
    });

    it('VALID: template => contains output format section', () => {
      expect(gapReviewerAgentPromptStatics.prompt.template).toMatch(/Quest Review:/u);
      expect(gapReviewerAgentPromptStatics.prompt.template).toMatch(/Critical Issues/u);
    });

    it('VALID: template => contains $ARGUMENTS placeholder', () => {
      expect(gapReviewerAgentPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: placeholders.arguments => returns $ARGUMENTS', () => {
      expect(gapReviewerAgentPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });
  });
});
