import { partiallyCompleteSignalContract } from './partially-complete-signal-contract';
import { PartiallyCompleteSignalStub } from './partially-complete-signal.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

describe('partiallyCompleteSignalContract', () => {
  describe('valid inputs', () => {
    it('VALID: {signal: "partially-complete", stepId, progress, continuationPoint} => parses successfully', () => {
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const input = PartiallyCompleteSignalStub({
        stepId,
        progress: 'Completed 75%',
        continuationPoint: 'Resume at step 4',
      });

      const result = partiallyCompleteSignalContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'partially-complete',
        stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        progress: 'Completed 75%',
        continuationPoint: 'Resume at step 4',
      });
    });

    it('VALID: {default stub values} => parses with defaults', () => {
      const input = PartiallyCompleteSignalStub();

      const result = partiallyCompleteSignalContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'partially-complete',
        stepId: input.stepId,
        progress: 'Completed 50% of the task',
        continuationPoint: 'Continue from step 3',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SIGNAL: {signal: "wrong"} => throws validation error', () => {
      expect(() => {
        partiallyCompleteSignalContract.parse({
          signal: 'wrong',
          stepId: StepIdStub(),
          progress: 'Test progress',
          continuationPoint: 'Test continuation',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID_STEP_ID: {stepId: "not-uuid"} => throws validation error', () => {
      expect(() => {
        partiallyCompleteSignalContract.parse({
          signal: 'partially-complete',
          stepId: 'not-a-uuid',
          progress: 'Test progress',
          continuationPoint: 'Test continuation',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_PROGRESS: {progress: ""} => throws validation error', () => {
      expect(() => {
        partiallyCompleteSignalContract.parse({
          signal: 'partially-complete',
          stepId: StepIdStub(),
          progress: '',
          continuationPoint: 'Test continuation',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_CONTINUATION_POINT: {continuationPoint: ""} => throws validation error', () => {
      expect(() => {
        partiallyCompleteSignalContract.parse({
          signal: 'partially-complete',
          stepId: StepIdStub(),
          progress: 'Test progress',
          continuationPoint: '',
        });
      }).toThrow(/too_small/u);
    });
  });
});
