import { streamSignalContract } from './stream-signal-contract';
import { StreamSignalStub } from './stream-signal.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

type StreamSignal = ReturnType<typeof StreamSignalStub>;

describe('streamSignalContract', () => {
  describe('valid signals', () => {
    it('VALID: {signal: "complete"} => parses complete signal', () => {
      const stepId = StepIdStub();
      const result = streamSignalContract.parse({
        signal: 'complete',
        stepId,
        summary: 'Done',
      });

      expect(result).toStrictEqual({
        signal: 'complete',
        stepId,
        summary: 'Done',
      });
    });

    it('VALID: {signal: "partially-complete"} => parses partially-complete signal', () => {
      const stepId = StepIdStub();
      const result = streamSignalContract.parse({
        signal: 'partially-complete',
        stepId,
        progress: 'Half done',
        continuationPoint: 'Step 3',
      });

      expect(result).toStrictEqual({
        signal: 'partially-complete',
        stepId,
        progress: 'Half done',
        continuationPoint: 'Step 3',
      });
    });

    it('VALID: {signal: "needs-role-followup"} => parses needs-role-followup signal', () => {
      const stepId = StepIdStub();
      const result = streamSignalContract.parse({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'PathSeeker',
        reason: 'Need file mapping',
        context: 'Quest setup',
        resume: true,
      });

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'PathSeeker',
        reason: 'Need file mapping',
        context: 'Quest setup',
        resume: true,
      });
    });

    it('VALID: stub default => returns complete signal with expected structure', () => {
      const signal: StreamSignal = StreamSignalStub();
      const { stepId } = signal;

      expect(signal).toStrictEqual({
        signal: 'complete',
        stepId,
        summary: 'Task completed successfully',
      });
    });

    it('VALID: {signal: "needs-role-followup", resume: false} => parses with resume false', () => {
      const stepId = StepIdStub();
      const result = streamSignalContract.parse({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'TestRole',
        reason: 'Test reason',
        context: 'Test context',
        resume: false,
      });

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'TestRole',
        reason: 'Test reason',
        context: 'Test context',
        resume: false,
      });
    });

    it('VALID: {signal: "complete"} => parses without optional summary', () => {
      const stepId = StepIdStub();
      const result = streamSignalContract.parse({
        signal: 'complete',
        stepId,
      });

      expect(result).toStrictEqual({
        signal: 'complete',
        stepId,
      });
    });

    it('VALID: {signal: "partially-complete"} => parses minimal without optional fields', () => {
      const stepId = StepIdStub();
      const result = streamSignalContract.parse({
        signal: 'partially-complete',
        stepId,
      });

      expect(result).toStrictEqual({
        signal: 'partially-complete',
        stepId,
      });
    });

    it('VALID: {signal: "needs-role-followup"} => parses minimal without optional fields', () => {
      const stepId = StepIdStub();
      const result = streamSignalContract.parse({
        signal: 'needs-role-followup',
        stepId,
      });

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        stepId,
      });
    });
  });

  describe('invalid signals', () => {
    it('INVALID_SIGNAL: {signal: "unknown"} => throws for invalid signal type', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'unknown',
          stepId: StepIdStub(),
        }),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID_SIGNAL: {signal: missing} => throws for missing signal', () => {
      expect(() =>
        streamSignalContract.parse({
          stepId: StepIdStub(),
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_STEP_ID: {stepId: missing} => throws for missing stepId', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'complete',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_STEP_ID: {stepId: "not-a-uuid"} => throws for invalid UUID format', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'complete',
          stepId: 'not-a-uuid',
        }),
      ).toThrow(/Invalid uuid/u);
    });

    it('INVALID_SUMMARY: {summary: ""} => throws for empty summary', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'complete',
          stepId: StepIdStub(),
          summary: '',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_PROGRESS: {progress: ""} => throws for empty progress', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'partially-complete',
          stepId: StepIdStub(),
          progress: '',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_CONTEXT: {context: ""} => throws for empty context', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          context: '',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_TARGET_ROLE: {targetRole: ""} => throws for empty targetRole', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          targetRole: '',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_REASON: {reason: ""} => throws for empty reason', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          reason: '',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_CONTINUATION_POINT: {continuationPoint: ""} => throws for empty continuationPoint', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'partially-complete',
          stepId: StepIdStub(),
          continuationPoint: '',
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_RESUME: {resume: "not-boolean"} => throws for non-boolean resume', () => {
      expect(() =>
        streamSignalContract.parse({
          signal: 'needs-role-followup',
          stepId: StepIdStub(),
          resume: 'not-boolean' as never,
        }),
      ).toThrow(/Expected boolean/u);
    });
  });
});
