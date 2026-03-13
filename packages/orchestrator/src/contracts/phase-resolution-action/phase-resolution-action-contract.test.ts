import { phaseResolutionActionContract } from './phase-resolution-action-contract';
import { PhaseResolutionActionStub } from './phase-resolution-action.stub';

describe('phaseResolutionActionContract', () => {
  describe('valid actions', () => {
    it('VALID: {launch-pathseeker} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'launch-pathseeker' });

      expect(result).toBe('launch-pathseeker');
    });

    it('VALID: {launch-chat} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'launch-chat' });

      expect(result).toBe('launch-chat');
    });

    it('VALID: {resume-chat} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'resume-chat' });

      expect(result).toBe('resume-chat');
    });

    it('VALID: {launch-codeweaver} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'launch-codeweaver' });

      expect(result).toBe('launch-codeweaver');
    });

    it('VALID: {launch-ward} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'launch-ward' });

      expect(result).toBe('launch-ward');
    });

    it('VALID: {launch-siegemaster} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'launch-siegemaster' });

      expect(result).toBe('launch-siegemaster');
    });

    it('VALID: {launch-lawbringer} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'launch-lawbringer' });

      expect(result).toBe('launch-lawbringer');
    });

    it('VALID: {complete} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'complete' });

      expect(result).toBe('complete');
    });

    it('VALID: {blocked} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'blocked' });

      expect(result).toBe('blocked');
    });

    it('VALID: {wait-for-user} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'wait-for-user' });

      expect(result).toBe('wait-for-user');
    });

    it('VALID: {halt} => parses successfully', () => {
      const result = PhaseResolutionActionStub({ value: 'halt' });

      expect(result).toBe('halt');
    });
  });

  describe('invalid actions', () => {
    it('INVALID_ACTION: {unknown action} => throws validation error', () => {
      expect(() => {
        phaseResolutionActionContract.parse('unknown');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
