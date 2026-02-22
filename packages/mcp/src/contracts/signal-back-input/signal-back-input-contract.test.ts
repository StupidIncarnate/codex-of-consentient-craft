import { signalBackInputContract } from './signal-back-input-contract';
import { SignalBackInputStub } from './signal-back-input.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

describe('signalBackInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {signal: "complete"} => parses complete signal', () => {
      const input = SignalBackInputStub({
        signal: 'complete',
        stepId: StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        summary: 'Task done',
      });

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'complete',
        stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        summary: 'Task done',
      });
    });

    it('VALID: {signal: "partially-complete"} => parses partially-complete signal', () => {
      const input = SignalBackInputStub({
        signal: 'partially-complete',
        stepId: StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        progress: '50% done',
        continuationPoint: 'Resume at step 3',
      });

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'partially-complete',
        stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        progress: '50% done',
        continuationPoint: 'Resume at step 3',
      });
    });

    it('VALID: {signal: "needs-role-followup", resume: false} => parses needs-role-followup signal', () => {
      const input = SignalBackInputStub({
        signal: 'needs-role-followup',
        stepId: StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        targetRole: 'reviewer',
        reason: 'Need review',
        context: 'Code ready',
        resume: false,
      });

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        targetRole: 'reviewer',
        reason: 'Need review',
        context: 'Code ready',
        resume: false,
      });
    });

    it('VALID: {signal: "needs-role-followup", resume: true} => parses with resume flag', () => {
      const input = SignalBackInputStub({
        signal: 'needs-role-followup',
        stepId: StepIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' }),
        targetRole: 'tester',
        reason: 'Need tests',
        context: 'Implementation done',
        resume: true,
      });

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        stepId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        targetRole: 'tester',
        reason: 'Need tests',
        context: 'Implementation done',
        resume: true,
      });
    });

    it('EDGE: {only required fields with stepId} => parses minimal input', () => {
      const stepId = StepIdStub({ value: 'c3d4e5f6-a7b8-9012-cdef-123456789012' });

      const result = signalBackInputContract.parse({
        signal: 'complete',
        stepId,
      });

      expect(result).toStrictEqual({
        signal: 'complete',
        stepId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      });
    });

    it('EDGE: {signal only, no stepId} => parses without stepId', () => {
      const result = signalBackInputContract.parse({
        signal: 'complete',
      });

      expect(result).toStrictEqual({
        signal: 'complete',
      });
    });

    it('VALID: {signal: "complete", no stepId, with summary} => parses complete signal without stepId', () => {
      const result = signalBackInputContract.parse({
        signal: 'complete',
        summary: 'Task done',
      });

      expect(result).toStrictEqual({
        signal: 'complete',
        summary: 'Task done',
      });
    });

    it('VALID: {signal: "partially-complete", no stepId} => parses partially-complete signal without stepId', () => {
      const result = signalBackInputContract.parse({
        signal: 'partially-complete',
        progress: '50% done',
        continuationPoint: 'Resume at step 3',
      });

      expect(result).toStrictEqual({
        signal: 'partially-complete',
        progress: '50% done',
        continuationPoint: 'Resume at step 3',
      });
    });

    it('VALID: {signal: "needs-role-followup", no stepId} => parses needs-role-followup signal without stepId', () => {
      const result = signalBackInputContract.parse({
        signal: 'needs-role-followup',
        targetRole: 'reviewer',
        reason: 'Need review',
        context: 'Code ready',
        resume: false,
      });

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        targetRole: 'reviewer',
        reason: 'Need review',
        context: 'Code ready',
        resume: false,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SIGNAL: {signal: "unknown"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'unknown',
          stepId: StepIdStub(),
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_STEP_ID: {stepId: "not-uuid"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'complete',
          stepId: 'not-a-uuid',
          summary: 'Test',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_SUMMARY: {summary: ""} => throws validation error for empty string', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'complete',
          stepId: StepIdStub(),
          summary: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_PROGRESS: {progress: ""} => throws validation error for empty string', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'partially-complete',
          stepId: StepIdStub(),
          progress: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_CONTINUATION_POINT: {continuationPoint: ""} => throws validation error for empty string', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'partially-complete',
          stepId: StepIdStub(),
          continuationPoint: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_CONTEXT: {context: ""} => throws validation error for empty string', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          context: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_TARGET_ROLE: {targetRole: ""} => throws validation error for empty string', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          targetRole: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_REASON: {reason: ""} => throws validation error for empty string', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          reason: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_MULTIPLE: {missing signal} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
