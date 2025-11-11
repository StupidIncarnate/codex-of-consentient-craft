import { editToolInputContract } from './edit-tool-input-contract';
import { EditToolInputStub } from './edit-tool-input.stub';

describe('editToolInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all required fields with replace_all false} => parses successfully', () => {
      const input = EditToolInputStub();

      const result = editToolInputContract.parse(input);

      expect(result).toStrictEqual({
        file_path: '/test/file.ts',
        old_string: 'old value',
        new_string: 'new value',
        replace_all: false,
      });
    });

    it('VALID: {all required fields with replace_all true} => parses successfully', () => {
      const input = EditToolInputStub({ replace_all: true });

      const result = editToolInputContract.parse(input);

      expect(result).toStrictEqual({
        file_path: '/test/file.ts',
        old_string: 'old value',
        new_string: 'new value',
        replace_all: true,
      });
    });

    it('VALID: {custom strings} => parses successfully', () => {
      const input = EditToolInputStub({
        old_string: 'foo',
        new_string: 'bar',
      });

      const result = editToolInputContract.parse(input);

      expect(result).toStrictEqual({
        file_path: '/test/file.ts',
        old_string: 'foo',
        new_string: 'bar',
        replace_all: false,
      });
    });

    it('VALID: {custom file path} => parses successfully', () => {
      const input = EditToolInputStub({
        file_path: '/custom/path/file.ts',
      });

      const result = editToolInputContract.parse(input);

      expect(result).toStrictEqual({
        file_path: '/custom/path/file.ts',
        old_string: 'old value',
        new_string: 'new value',
        replace_all: false,
      });
    });

    it('VALID: {all custom values} => parses successfully', () => {
      const input = EditToolInputStub({
        file_path: '/src/index.ts',
        old_string: 'const',
        new_string: 'let',
        replace_all: true,
      });

      const result = editToolInputContract.parse(input);

      expect(result).toStrictEqual({
        file_path: '/src/index.ts',
        old_string: 'const',
        new_string: 'let',
        replace_all: true,
      });
    });

    it('VALID: {replace_all omitted} => parses with replace_all undefined', () => {
      const result = editToolInputContract.parse({
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      });

      expect(result).toStrictEqual({
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      });
    });

    it('VALID: {empty strings for old_string and new_string} => parses successfully', () => {
      const result = editToolInputContract.parse({
        file_path: '/test/file.ts',
        old_string: '',
        new_string: '',
        replace_all: false,
      });

      expect(result).toStrictEqual({
        file_path: '/test/file.ts',
        old_string: '',
        new_string: '',
        replace_all: false,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_FILE_PATH: {missing file_path} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({
          old_string: 'old',
          new_string: 'new',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_FILE_PATH: {empty file_path} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({
          file_path: '',
          old_string: 'old',
          new_string: 'new',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_OLD_STRING: {missing old_string} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({
          file_path: '/test/file.ts',
          new_string: 'new',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_NEW_STRING: {missing new_string} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({
          file_path: '/test/file.ts',
          old_string: 'old',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {missing all required fields} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_FILE_PATH: {file_path is number} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({
          file_path: 123 as never,
          old_string: 'old',
          new_string: 'new',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_OLD_STRING: {old_string is number} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({
          file_path: '/test/file.ts',
          old_string: 123 as never,
          new_string: 'new',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_NEW_STRING: {new_string is number} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({
          file_path: '/test/file.ts',
          old_string: 'old',
          new_string: 123 as never,
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_REPLACE_ALL: {replace_all is string} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({
          file_path: '/test/file.ts',
          old_string: 'old',
          new_string: 'new',
          replace_all: 'true' as never,
        });
      }).toThrow(/Expected boolean/u);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return editToolInputContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
