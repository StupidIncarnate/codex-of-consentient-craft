import { verificationStepContract } from './verification-step-contract';
import { VerificationStepStub } from './verification-step.stub';

describe('verificationStepContract', () => {
  describe('valid verification steps', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const step = VerificationStepStub();

      expect(step).toStrictEqual({
        action: 'assert',
        target: 'response.status',
        value: '200',
        condition: 'equals',
        type: 'api-call',
      });
    });

    it('VALID: {action only} => parses with only required field', () => {
      const step = VerificationStepStub({
        action: 'navigate',
      });

      expect(step.action).toBe('navigate');
    });

    it('VALID: {without optional fields} => parses successfully', () => {
      const step = verificationStepContract.parse({
        action: 'click',
      });

      expect(step).toStrictEqual({
        action: 'click',
      });
    });

    it('VALID: {with type ui-state} => parses with outcome type', () => {
      const step = VerificationStepStub({
        action: 'verify',
        target: '[data-modal]',
        condition: 'visible',
        type: 'ui-state',
      });

      expect(step.type).toBe('ui-state');
      expect(step.target).toBe('[data-modal]');
    });
  });

  describe('invalid verification steps', () => {
    it('INVALID_ACTION: {action: ""} => throws validation error', () => {
      expect(() => {
        verificationStepContract.parse({
          action: '',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_TYPE: {type: "bad"} => throws validation error', () => {
      expect(() => {
        verificationStepContract.parse({
          action: 'assert',
          type: 'bad',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_ACTION: {missing action} => throws validation error', () => {
      expect(() => {
        verificationStepContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
