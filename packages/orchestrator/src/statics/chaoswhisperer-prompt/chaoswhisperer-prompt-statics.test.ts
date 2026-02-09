import { chaoswhispererPromptStatics } from './chaoswhisperer-prompt-statics';

describe('chaoswhispererPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: template => contains ChaosWhisperer identity', () => {
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(
        /^# ChaosWhisperer - BDD Architect Agent/u,
      );
    });

    it('VALID: template => contains Socratic dialogue process', () => {
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(/Socratic dialogue/u);
    });

    it('VALID: template => contains MCP tools section', () => {
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(/add-quest/u);
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(/modify-quest/u);
    });

    it('VALID: template => contains workflow phases', () => {
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(/Phase 1: Discovery/u);
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(
        /Phase 3: Requirements Approval Gate/u,
      );
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(/Phase 7: File Mapping/u);
    });

    it('VALID: template => contains AskUserQuestion tool reference', () => {
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(/AskUserQuestion/u);
    });

    it('VALID: template => contains $ARGUMENTS placeholder', () => {
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: placeholders.arguments => returns $ARGUMENTS', () => {
      expect(chaoswhispererPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });
  });
});
