import { completeSignalContract } from './complete-signal-contract';
import { CompleteSignalStub } from './complete-signal.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

describe('completeSignalContract', () => {
  describe('valid inputs', () => {
    it('VALID: {signal: "complete", stepId, summary} => parses successfully', () => {
      const stepId = StepIdStub({ value: 'create-login-api' });
      const input = CompleteSignalStub({
        stepId,
        summary: 'Task completed successfully',
      });

      const result = completeSignalContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'complete',
        stepId: 'create-login-api',
        summary: 'Task completed successfully',
      });
    });

    it('VALID: {default stub values} => parses with defaults', () => {
      const input = CompleteSignalStub();

      const result = completeSignalContract.parse(input);

      expect(result).toStrictEqual(input);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {summary: "x"} => parses minimum valid summary', () => {
      const input = CompleteSignalStub({ summary: 'x' as never });

      const result = completeSignalContract.parse(input);

      expect(result).toStrictEqual(input);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {input: null} => throws validation error', () => {
      expect(() => {
        completeSignalContract.parse(null);
      }).toThrow(/invalid_type/u);
    });

    it('EMPTY: {input: undefined} => throws validation error', () => {
      expect(() => {
        completeSignalContract.parse(undefined);
      }).toThrow(/Required/u);
    });

    it('EMPTY: {input: {}} => throws validation error', () => {
      expect(() => {
        completeSignalContract.parse({});
      }).toThrow(/invalid_literal/u);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {signal: "wrong"} => throws validation error', () => {
      expect(() => {
        completeSignalContract.parse({
          signal: 'wrong',
          stepId: StepIdStub(),
          summary: 'Test summary',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {stepId: "INVALID"} => throws validation error', () => {
      expect(() => {
        completeSignalContract.parse({
          signal: 'complete',
          stepId: 'INVALID',
          summary: 'Test summary',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {summary: ""} => throws validation error', () => {
      expect(() => {
        completeSignalContract.parse({
          signal: 'complete',
          stepId: StepIdStub(),
          summary: '',
        });
      }).toThrow(/too_small/u);
    });
  });
});
