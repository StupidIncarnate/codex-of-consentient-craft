/**
 * PURPOSE: Tests for signalContextContract
 */

import { signalContextContract } from './signal-context-contract';
import { SignalContextStub } from './signal-context.stub';

describe('signalContextContract', () => {
  describe('valid contexts', () => {
    it('VALID: {non-empty string} => parses successfully', () => {
      const context = SignalContextStub({ value: 'Working on login flow' });

      const result = signalContextContract.parse(context);

      expect(result).toBe('Working on login flow');
    });

    it('VALID: {default stub} => parses successfully', () => {
      const context = SignalContextStub();

      const result = signalContextContract.parse(context);

      expect(result).toBe('Gathering authentication requirements');
    });
  });

  describe('invalid contexts', () => {
    it('INVALID: {empty string} => throws validation error', () => {
      expect(() => {
        signalContextContract.parse('');
      }).toThrow(/too_small/u);
    });
  });
});
