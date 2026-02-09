import { orchestrationPhaseContract } from './orchestration-phase-contract';
import { OrchestrationPhaseStub } from './orchestration-phase.stub';

describe('orchestrationPhaseContract', () => {
  describe('valid phases', () => {
    it('VALID: {pathseeker} => parses successfully', () => {
      const phase = OrchestrationPhaseStub({ value: 'pathseeker' });

      const result = orchestrationPhaseContract.parse(phase);

      expect(result).toBe('pathseeker');
    });

    it('VALID: {codeweaver} => parses successfully', () => {
      const phase = OrchestrationPhaseStub({ value: 'codeweaver' });

      const result = orchestrationPhaseContract.parse(phase);

      expect(result).toBe('codeweaver');
    });

    it('VALID: {complete} => parses successfully', () => {
      const phase = OrchestrationPhaseStub({ value: 'complete' });

      const result = orchestrationPhaseContract.parse(phase);

      expect(result).toBe('complete');
    });
  });

  describe('invalid phases', () => {
    it('INVALID: {unknown phase} => throws validation error', () => {
      expect(() => {
        orchestrationPhaseContract.parse('unknown-phase');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
