import { AbsoluteFilePathStub, ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { fileWorkUnitContract } from './file-work-unit-contract';
import { FileWorkUnitStub } from './file-work-unit.stub';

describe('fileWorkUnitContract', () => {
  describe('valid file work units', () => {
    it('VALID: {filePath, errors} => parses successfully', () => {
      const filePath = AbsoluteFilePathStub({ value: '/src/example.ts' });
      const errors = [ErrorMessageStub({ value: 'Missing return type' })];

      const result = fileWorkUnitContract.parse({
        filePath,
        errors,
      });

      expect(result).toStrictEqual({
        filePath,
        errors,
      });
    });

    it('VALID: {stub defaults} => parses with default values', () => {
      const workUnit = FileWorkUnitStub();

      const result = fileWorkUnitContract.parse(workUnit);

      expect(result).toStrictEqual(workUnit);
    });

    it('VALID: {multiple errors} => parses array of errors', () => {
      const filePath = AbsoluteFilePathStub({ value: '/src/file.ts' });
      const errors = [
        ErrorMessageStub({ value: 'Error 1' }),
        ErrorMessageStub({ value: 'Error 2' }),
        ErrorMessageStub({ value: 'Error 3' }),
      ];

      const result = fileWorkUnitContract.parse({
        filePath,
        errors,
      });

      expect(result).toStrictEqual({
        filePath,
        errors,
      });
    });

    it('EDGE: {empty errors array} => parses successfully', () => {
      const filePath = AbsoluteFilePathStub({ value: '/src/clean-file.ts' });

      const result = fileWorkUnitContract.parse({
        filePath,
        errors: [],
      });

      expect(result).toStrictEqual({
        filePath,
        errors: [],
      });
    });
  });

  describe('invalid file work units', () => {
    it('INVALID_FILE_PATH: {filePath: "relative/path"} => throws validation error', () => {
      const errors = [ErrorMessageStub({ value: 'Some error' })];

      expect(() =>
        fileWorkUnitContract.parse({
          filePath: 'relative/path',
          errors,
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID_FILE_PATH: {filePath: ""} => throws validation error', () => {
      const errors = [ErrorMessageStub({ value: 'Some error' })];

      expect(() =>
        fileWorkUnitContract.parse({
          filePath: '',
          errors,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID_ERRORS: {errors: "not-an-array"} => throws validation error', () => {
      const filePath = AbsoluteFilePathStub({ value: '/src/file.ts' });

      expect(() =>
        fileWorkUnitContract.parse({
          filePath,
          errors: 'not-an-array',
        }),
      ).toThrow(/Expected array/u);
    });

    it('INVALID_MISSING: {} => throws Required', () => {
      expect(() => fileWorkUnitContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID_MISSING: {filePath only} => throws Required for errors', () => {
      const filePath = AbsoluteFilePathStub({ value: '/src/file.ts' });

      expect(() =>
        fileWorkUnitContract.parse({
          filePath,
        }),
      ).toThrow(/Required/u);
    });
  });
});
