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

    it('VALID: {ward} => parses successfully', () => {
      const phase = OrchestrationPhaseStub({ value: 'ward' });

      const result = orchestrationPhaseContract.parse(phase);

      expect(result).toBe('ward');
    });

    it('VALID: {failed} => parses successfully', () => {
      const phase = OrchestrationPhaseStub({ value: 'failed' });

      const result = orchestrationPhaseContract.parse(phase);

      expect(result).toBe('failed');
    });

    it('VALID: {siegemaster} => parses successfully', () => {
      const phase = OrchestrationPhaseStub({ value: 'siegemaster' });

      const result = orchestrationPhaseContract.parse(phase);

      expect(result).toBe('siegemaster');
    });

    it('VALID: {spiritmender} => parses successfully', () => {
      const phase = OrchestrationPhaseStub({ value: 'spiritmender' });

      const result = orchestrationPhaseContract.parse(phase);

      expect(result).toBe('spiritmender');
    });

    it('VALID: {lawbringer} => parses successfully', () => {
      const phase = OrchestrationPhaseStub({ value: 'lawbringer' });

      const result = orchestrationPhaseContract.parse(phase);

      expect(result).toBe('lawbringer');
    });

    it('VALID: {idle} => parses successfully', () => {
      const phase = OrchestrationPhaseStub({ value: 'idle' });

      const result = orchestrationPhaseContract.parse(phase);

      expect(result).toBe('idle');
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
