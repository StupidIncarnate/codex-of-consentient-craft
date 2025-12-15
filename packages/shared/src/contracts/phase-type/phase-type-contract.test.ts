import { phaseTypeContract } from './phase-type-contract';
import { PhaseTypeStub } from './phase-type.stub';

describe('phaseTypeContract', () => {
  describe('valid phase types', () => {
    it('VALID: discovery => parses successfully', () => {
      const phaseType = PhaseTypeStub({ value: 'discovery' });

      const result = phaseTypeContract.parse(phaseType);

      expect(result).toBe('discovery');
    });

    it('VALID: implementation => parses successfully', () => {
      const phaseType = PhaseTypeStub({ value: 'implementation' });

      const result = phaseTypeContract.parse(phaseType);

      expect(result).toBe('implementation');
    });

    it('VALID: testing => parses successfully', () => {
      const phaseType = PhaseTypeStub({ value: 'testing' });

      const result = phaseTypeContract.parse(phaseType);

      expect(result).toBe('testing');
    });

    it('VALID: review => parses successfully', () => {
      const phaseType = PhaseTypeStub({ value: 'review' });

      const result = phaseTypeContract.parse(phaseType);

      expect(result).toBe('review');
    });
  });

  describe('invalid phase types', () => {
    it('INVALID: unknown phase type => throws validation error', () => {
      expect(() => {
        phaseTypeContract.parse('invalid_phase');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
