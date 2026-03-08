import { displayFilePathContract } from './display-file-path-contract';
import { DisplayFilePathStub } from './display-file-path.stub';

describe('displayFilePathContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "src/auth.ts"} => parses valid file path', () => {
      const result = displayFilePathContract.parse('src/auth.ts');

      expect(result).toBe('src/auth.ts');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => displayFilePathContract.parse('')).toThrow(/String must contain at least 1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid display file path', () => {
      const result = DisplayFilePathStub();

      expect(result).toBe('src/auth.ts');
    });

    it('VALID: {value: "lib/utils.ts"} => creates with custom value', () => {
      const result = DisplayFilePathStub({ value: 'lib/utils.ts' });

      expect(result).toBe('lib/utils.ts');
    });
  });
});
