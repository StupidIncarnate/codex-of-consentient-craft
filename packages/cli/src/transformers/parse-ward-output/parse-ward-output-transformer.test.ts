import { parseWardOutputTransformer } from './parse-ward-output-transformer';
import { WardOutputStub } from '../../contracts/ward-output/ward-output.stub';

describe('parseWardOutputTransformer', () => {
  describe('empty output', () => {
    it('EMPTY: {empty string} => returns empty array', () => {
      const output = WardOutputStub({ value: '' });

      const result = parseWardOutputTransformer({ output });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {whitespace only} => returns empty array', () => {
      const output = WardOutputStub({ value: '   \n\t  ' });

      const result = parseWardOutputTransformer({ output });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single error', () => {
    it('VALID: {single TypeScript error} => returns FileWorkUnit with error', () => {
      const output = WardOutputStub({
        value: '/home/user/project/src/file.ts:10:5 - error TS2304: Cannot find name',
      });

      const result = parseWardOutputTransformer({ output });

      expect(result).toStrictEqual([
        {
          filePath: '/home/user/project/src/file.ts',
          errors: ['error TS2304: Cannot find name'],
        },
      ]);
    });

    it('VALID: {ESLint style error} => returns FileWorkUnit with error', () => {
      const output = WardOutputStub({
        value: '/home/user/project/src/file.ts:15:1: Missing return type on function',
      });

      const result = parseWardOutputTransformer({ output });

      expect(result).toStrictEqual([
        {
          filePath: '/home/user/project/src/file.ts',
          errors: ['Missing return type on function'],
        },
      ]);
    });
  });

  describe('multiple errors same file', () => {
    it('VALID: {two errors in same file} => returns single FileWorkUnit with both errors', () => {
      const output = WardOutputStub({
        value: `/home/user/project/src/file.ts:10:5 - error TS2304: Cannot find name
/home/user/project/src/file.ts:20:3 - error TS7006: Parameter implicitly has any type`,
      });

      const result = parseWardOutputTransformer({ output });

      expect(result).toStrictEqual([
        {
          filePath: '/home/user/project/src/file.ts',
          errors: [
            'error TS2304: Cannot find name',
            'error TS7006: Parameter implicitly has any type',
          ],
        },
      ]);
    });
  });

  describe('multiple errors different files', () => {
    it('VALID: {errors in different files} => returns FileWorkUnit per file', () => {
      const output = WardOutputStub({
        value: `/home/user/project/src/file1.ts:10:5 - error TS2304: Cannot find name
/home/user/project/src/file2.ts:20:3 - error TS7006: Parameter has any type`,
      });

      const result = parseWardOutputTransformer({ output });

      expect(result).toStrictEqual([
        {
          filePath: '/home/user/project/src/file1.ts',
          errors: ['error TS2304: Cannot find name'],
        },
        {
          filePath: '/home/user/project/src/file2.ts',
          errors: ['error TS7006: Parameter has any type'],
        },
      ]);
    });
  });

  describe('non-matching output', () => {
    it('VALID: {no matching error patterns} => returns empty array', () => {
      const output = WardOutputStub({
        value: 'Build successful! No errors found.',
      });

      const result = parseWardOutputTransformer({ output });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {relative path errors} => returns empty array', () => {
      const output = WardOutputStub({
        value: 'src/file.ts:10:5 - error TS2304: Cannot find name',
      });

      const result = parseWardOutputTransformer({ output });

      expect(result).toStrictEqual([]);
    });
  });

  describe('mixed output', () => {
    it('VALID: {valid errors mixed with noise} => returns only valid errors', () => {
      const output = WardOutputStub({
        value: `Running ward check...
/home/user/project/src/file.ts:10:5 - error TS2304: Cannot find name
Some random log message
/home/user/project/src/other.ts:5:1 - Missing semicolon
Done.`,
      });

      const result = parseWardOutputTransformer({ output });

      expect(result).toStrictEqual([
        {
          filePath: '/home/user/project/src/file.ts',
          errors: ['error TS2304: Cannot find name'],
        },
        {
          filePath: '/home/user/project/src/other.ts',
          errors: ['Missing semicolon'],
        },
      ]);
    });
  });
});
