import { planningSynthesisContract } from './planning-synthesis-contract';
import { PlanningSynthesisStub } from './planning-synthesis.stub';

describe('planningSynthesisContract', () => {
  describe('valid synthesis', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = PlanningSynthesisStub();

      expect(result).toStrictEqual({
        orderOfOperations: '1. Set up contracts. 2. Wire adapters. 3. Build brokers.',
        crossSliceResolutions: 'Slices A and B share the session contract; A writes first.',
        claudemdRulesInEffect: [],
        openAssumptions: [],
        synthesizedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {claudemdRulesInEffect + openAssumptions populated} => parses successfully', () => {
      const result = PlanningSynthesisStub({
        claudemdRulesInEffect: ['Rebuild shared after changes'],
        openAssumptions: ['Assuming sessions are single-user'],
      });

      expect(result).toStrictEqual({
        orderOfOperations: '1. Set up contracts. 2. Wire adapters. 3. Build brokers.',
        crossSliceResolutions: 'Slices A and B share the session contract; A writes first.',
        claudemdRulesInEffect: ['Rebuild shared after changes'],
        openAssumptions: ['Assuming sessions are single-user'],
        synthesizedAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid synthesis', () => {
    it('INVALID: {orderOfOperations: ""} => throws validation error', () => {
      expect(() => {
        return planningSynthesisContract.parse({
          orderOfOperations: '',
          crossSliceResolutions: 'x',
          synthesizedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {crossSliceResolutions: ""} => throws validation error', () => {
      expect(() => {
        return planningSynthesisContract.parse({
          orderOfOperations: 'x',
          crossSliceResolutions: '',
          synthesizedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {synthesizedAt: "not-a-date"} => throws validation error', () => {
      expect(() => {
        return planningSynthesisContract.parse({
          orderOfOperations: 'x',
          crossSliceResolutions: 'x',
          synthesizedAt: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {claudemdRulesInEffect: [""]} => throws validation error', () => {
      expect(() => {
        return planningSynthesisContract.parse({
          orderOfOperations: 'x',
          crossSliceResolutions: 'x',
          claudemdRulesInEffect: [''],
          synthesizedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
