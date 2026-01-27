import { needsUserInputSignalContract } from './needs-user-input-signal-contract';
import { NeedsUserInputSignalStub } from './needs-user-input-signal.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

describe('needsUserInputSignalContract', () => {
  describe('valid inputs', () => {
    it('VALID: {signal: "needs-user-input", stepId, question, context} => parses successfully', () => {
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const input = NeedsUserInputSignalStub({
        stepId,
        question: 'Which framework?',
        context: 'Setting up frontend',
      });

      const result = needsUserInputSignalContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'needs-user-input',
        stepId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        question: 'Which framework?',
        context: 'Setting up frontend',
      });
    });

    it('VALID: {default stub values} => parses with defaults', () => {
      const input = NeedsUserInputSignalStub();

      const result = needsUserInputSignalContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'needs-user-input',
        stepId: input.stepId,
        question: 'What database should be used?',
        context: 'Setting up data persistence layer',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SIGNAL: {signal: "wrong"} => throws validation error', () => {
      expect(() => {
        needsUserInputSignalContract.parse({
          signal: 'wrong',
          stepId: StepIdStub(),
          question: 'Test question',
          context: 'Test context',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID_STEP_ID: {stepId: "not-uuid"} => throws validation error', () => {
      expect(() => {
        needsUserInputSignalContract.parse({
          signal: 'needs-user-input',
          stepId: 'not-a-uuid',
          question: 'Test question',
          context: 'Test context',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_QUESTION: {question: ""} => throws validation error', () => {
      expect(() => {
        needsUserInputSignalContract.parse({
          signal: 'needs-user-input',
          stepId: StepIdStub(),
          question: '',
          context: 'Test context',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_CONTEXT: {context: ""} => throws validation error', () => {
      expect(() => {
        needsUserInputSignalContract.parse({
          signal: 'needs-user-input',
          stepId: StepIdStub(),
          question: 'Test question',
          context: '',
        });
      }).toThrow(/too_small/u);
    });
  });

  describe('missing fields', () => {
    it('EMPTY: {missing signal} => throws validation error', () => {
      expect(() => {
        needsUserInputSignalContract.parse({
          stepId: StepIdStub(),
          question: 'Test question',
          context: 'Test context',
        });
      }).toThrow(/invalid_literal|Required/u);
    });

    it('EMPTY: {missing stepId} => throws validation error', () => {
      expect(() => {
        needsUserInputSignalContract.parse({
          signal: 'needs-user-input',
          question: 'Test question',
          context: 'Test context',
        });
      }).toThrow(/Required/u);
    });

    it('EMPTY: {missing question} => throws validation error', () => {
      expect(() => {
        needsUserInputSignalContract.parse({
          signal: 'needs-user-input',
          stepId: StepIdStub(),
          context: 'Test context',
        });
      }).toThrow(/Required/u);
    });

    it('EMPTY: {missing context} => throws validation error', () => {
      expect(() => {
        needsUserInputSignalContract.parse({
          signal: 'needs-user-input',
          stepId: StepIdStub(),
          question: 'Test question',
        });
      }).toThrow(/Required/u);
    });
  });
});
