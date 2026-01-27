import { wardRunResultContract } from './ward-run-result-contract';
import type { WardRunResultStub } from './ward-run-result.stub';

type WardRunResult = ReturnType<typeof WardRunResultStub>;

describe('wardRunResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {success: true, empty errors} => returns WardRunResult', () => {
      const result: WardRunResult = wardRunResultContract.parse({
        success: true,
        output: '',
        errors: [],
      });

      expect(result).toStrictEqual({
        success: true,
        output: '',
        errors: [],
      });
    });

    it('VALID: {success: false, with errors} => returns WardRunResult', () => {
      const result: WardRunResult = wardRunResultContract.parse({
        success: false,
        output: '/src/file.ts:10:5 - error',
        errors: [
          {
            filePath: '/home/user/project/src/file.ts',
            errors: ['Missing return type'],
          },
        ],
      });

      expect(result).toStrictEqual({
        success: false,
        output: '/src/file.ts:10:5 - error',
        errors: [
          {
            filePath: '/home/user/project/src/file.ts',
            errors: ['Missing return type'],
          },
        ],
      });
    });

    it('VALID: {multiple errors} => returns WardRunResult with all errors', () => {
      const result: WardRunResult = wardRunResultContract.parse({
        success: false,
        output: 'multiple errors',
        errors: [
          {
            filePath: '/home/user/project/src/file1.ts',
            errors: ['Error 1'],
          },
          {
            filePath: '/home/user/project/src/file2.ts',
            errors: ['Error 2', 'Error 3'],
          },
        ],
      });

      expect(result).toStrictEqual({
        success: false,
        output: 'multiple errors',
        errors: [
          {
            filePath: '/home/user/project/src/file1.ts',
            errors: ['Error 1'],
          },
          {
            filePath: '/home/user/project/src/file2.ts',
            errors: ['Error 2', 'Error 3'],
          },
        ],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing success} => throws validation error', () => {
      expect(() =>
        wardRunResultContract.parse({
          output: '',
          errors: [],
        }),
      ).toThrow(/success/iu);
    });

    it('INVALID: {missing output} => throws validation error', () => {
      expect(() =>
        wardRunResultContract.parse({
          success: true,
          errors: [],
        }),
      ).toThrow(/output/iu);
    });

    it('INVALID: {missing errors} => throws validation error', () => {
      expect(() =>
        wardRunResultContract.parse({
          success: true,
          output: '',
        }),
      ).toThrow(/errors/iu);
    });

    it('INVALID: {invalid error in array} => throws validation error', () => {
      expect(() =>
        wardRunResultContract.parse({
          success: false,
          output: 'error',
          errors: [{ invalid: 'structure' }],
        }),
      ).toThrow(/filePath/iu);
    });
  });
});

describe('WardRunResultStub', () => {
  it('VALID: {default} => returns successful WardRunResult', () => {
    const { WardRunResultStub: Stub } = require('./ward-run-result.stub');
    const result = Stub();

    expect(result).toStrictEqual({
      success: true,
      output: '',
      errors: [],
    });
  });

  it('VALID: {custom success} => returns WardRunResult with custom success', () => {
    const { WardRunResultStub: Stub } = require('./ward-run-result.stub');
    const result = Stub({ success: false });

    expect(result).toStrictEqual({
      success: false,
      output: '',
      errors: [],
    });
  });
});
