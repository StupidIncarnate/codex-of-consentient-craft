/**
 * PURPOSE: Tests for signalQuestionContract
 */

import { signalQuestionContract } from './signal-question-contract';
import { SignalQuestionStub } from './signal-question.stub';

describe('signalQuestionContract', () => {
  describe('valid questions', () => {
    it('VALID: {non-empty string} => parses successfully', () => {
      const question = SignalQuestionStub({ value: 'What port number?' });

      const result = signalQuestionContract.parse(question);

      expect(result).toBe('What port number?');
    });

    it('VALID: {default stub} => parses successfully', () => {
      const question = SignalQuestionStub();

      const result = signalQuestionContract.parse(question);

      expect(result).toBe('What authentication method would you like to use?');
    });
  });

  describe('invalid questions', () => {
    it('INVALID: {empty string} => throws validation error', () => {
      expect(() => {
        signalQuestionContract.parse('');
      }).toThrow(/too_small/u);
    });
  });
});
