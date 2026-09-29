import { duplicateInstallDisplayTextContract } from './duplicate-install-display-text-contract';
import { DuplicateInstallDisplayTextStub } from './duplicate-install-display-text.stub';

describe('duplicateInstallDisplayTextContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "duplicate-install: PASS"} => parses successfully', () => {
      const result = duplicateInstallDisplayTextContract.parse(
        DuplicateInstallDisplayTextStub({ value: 'duplicate-install: PASS' }),
      );

      expect(result).toBe('duplicate-install: PASS');
    });

    it('VALID: {value: ""} => parses successfully (no min-length constraint)', () => {
      const result = duplicateInstallDisplayTextContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 123} => throws', () => {
      expect(() => duplicateInstallDisplayTextContract.parse(123)).toThrow(
        /Invalid input: expected string, received number/u,
      );
    });
  });
});
