/**
 * Tests for warningMessageContract
 */

import { WarningMessageStub } from './warning-message.stub';
import { warningMessageContract } from './warning-message-contract';

describe('warningMessageContract', () => {
  describe('valid warning messages', () => {
    it('VALID: {value: warning text} => parses successfully', () => {
      const warningMessage = WarningMessageStub({ value: 'Warning: Something went wrong' });

      expect(warningMessage).toBe('Warning: Something went wrong');
    });

    it('VALID: {default stub} => parses default message', () => {
      const warningMessage = WarningMessageStub();

      expect(warningMessage).toBe('Warning: Test warning message');
    });
  });

  describe('invalid warning messages', () => {
    it('INVALID_EMPTY: {value: empty string} => throws validation error', () => {
      expect(() => warningMessageContract.parse('')).toThrow(/too_small/u);
    });
  });
});
