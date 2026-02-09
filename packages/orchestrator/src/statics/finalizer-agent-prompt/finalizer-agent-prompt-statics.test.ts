import { finalizerAgentPromptStatics } from './finalizer-agent-prompt-statics';

describe('finalizerAgentPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: template => contains finalizer agent identity', () => {
      expect(finalizerAgentPromptStatics.prompt.template).toMatch(/^---\nname: quest-finalizer/u);
    });

    it('VALID: template => contains Quest Finalizer role', () => {
      expect(finalizerAgentPromptStatics.prompt.template).toMatch(/Quest Finalizer/u);
    });

    it('VALID: template => contains deterministic checks', () => {
      expect(finalizerAgentPromptStatics.prompt.template).toMatch(/verify-quest/u);
      expect(finalizerAgentPromptStatics.prompt.template).toMatch(/Deterministic Checks/u);
    });

    it('VALID: template => contains narrative tracing', () => {
      expect(finalizerAgentPromptStatics.prompt.template).toMatch(/Trace the Narrative/u);
    });

    it('VALID: template => contains output format section', () => {
      expect(finalizerAgentPromptStatics.prompt.template).toMatch(/Quest Finalization Report/u);
      expect(finalizerAgentPromptStatics.prompt.template).toMatch(/Critical Issues/u);
    });

    it('VALID: template => contains $ARGUMENTS placeholder', () => {
      expect(finalizerAgentPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: placeholders.arguments => returns $ARGUMENTS', () => {
      expect(finalizerAgentPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });
  });
});
