import { signalBackResultContract } from './signal-back-result-contract';
import { SignalBackResultStub } from './signal-back-result.stub';
import { SignalBackInputStub } from '../signal-back-input/signal-back-input.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

describe('signalBackResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {success: true, signal: complete} => parses successfully', () => {
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const signal = SignalBackInputStub({ signal: 'complete', stepId, summary: 'Done' });
      const input = SignalBackResultStub({ success: true, signal });

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'complete',
          stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          summary: 'Done',
        },
      });
    });

    it('VALID: {success: true, signal: partially-complete} => parses with progress and continuationPoint', () => {
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const signal = SignalBackInputStub({
        signal: 'partially-complete',
        stepId,
        progress: 'Half done',
        continuationPoint: 'Step 3',
      });
      const input = SignalBackResultStub({ success: true, signal });

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'partially-complete',
          stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          progress: 'Half done',
          continuationPoint: 'Step 3',
        },
      });
    });

    it('VALID: {success: true, signal: needs-user-input} => parses with question and context', () => {
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const signal = SignalBackInputStub({
        signal: 'needs-user-input',
        stepId,
        question: 'Which DB?',
        context: 'Setup',
      });
      const input = SignalBackResultStub({ success: true, signal });

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'needs-user-input',
          stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          question: 'Which DB?',
          context: 'Setup',
        },
      });
    });

    it('VALID: {success: true, signal: needs-role-followup} => parses with targetRole, reason, context, and resume', () => {
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const signal = SignalBackInputStub({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'tester',
        reason: 'Need tests',
        context: 'Feature done',
        resume: false,
      });
      const input = SignalBackResultStub({ success: true, signal });

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'needs-role-followup',
          stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          targetRole: 'tester',
          reason: 'Need tests',
          context: 'Feature done',
          resume: false,
        },
      });
    });

    it('VALID: {success: false, signal: complete} => parses with false success', () => {
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const signal = SignalBackInputStub({ signal: 'complete', stepId, summary: 'Done' });

      const result = signalBackResultContract.parse({
        success: false,
        signal,
      });

      expect(result).toStrictEqual({
        success: false,
        signal: {
          signal: 'complete',
          stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          summary: 'Done',
        },
      });
    });

    it('VALID: {default stub values} => parses with defaults', () => {
      const input = SignalBackResultStub();

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'complete',
          stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          summary: 'Step completed successfully',
        },
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SUCCESS: {success: "yes"} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: 'yes',
          signal: SignalBackInputStub(),
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_SIGNAL: {signal: null} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: true,
          signal: null,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID_SIGNAL: {signal: missing} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: true,
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_SUCCESS: {success: missing} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          signal: SignalBackInputStub(),
        });
      }).toThrow(/Required/u);
    });
  });
});
