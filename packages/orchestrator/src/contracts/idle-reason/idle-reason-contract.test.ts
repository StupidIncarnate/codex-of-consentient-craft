import { idleReasonContract } from './idle-reason-contract';
import { IdleReasonStub } from './idle-reason.stub';

describe('idleReasonContract', () => {
  describe('valid input', () => {
    it('VALID: {a guardrail sentence} => parses to the same string', () => {
      const reason = idleReasonContract.parse(
        'rate-limit guardrail: 7d window at 93%. Dispatch resumes at 2026-09-20T06:00:00.000Z.',
      );

      expect(reason).toBe(
        'rate-limit guardrail: 7d window at 93%. Dispatch resumes at 2026-09-20T06:00:00.000Z.',
      );
    });

    it('VALID: {default stub} => parses the exclusivity reason', () => {
      expect(IdleReasonStub()).toBe('the Node dispatcher owns the queue');
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {""} => throws, because an idle with a blank reason reads as an organic idle', () => {
      expect(() => IdleReasonStub({ value: '' })).toThrow(/String must contain at least 1/u);
    });
  });
});
