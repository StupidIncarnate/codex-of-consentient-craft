import { fileNameContract } from './file-name-contract';
import type { FileName } from './file-name-contract';

describe('fileNameContract', () => {
  it('VALID: {value: "test-file.ts"} => returns branded FileName', () => {
    const result = fileNameContract.parse('test-file.ts');

    expect(result).toBe('test-file.ts');

    const typed: FileName = result;

    expect(typed).toBe('test-file.ts');
  });

  it('VALID: {value: "component.tsx"} => returns branded FileName', () => {
    const result = fileNameContract.parse('component.tsx');

    expect(result).toBe('component.tsx');
  });

  it('VALID: {value: "index.js"} => returns branded FileName', () => {
    const result = fileNameContract.parse('index.js');

    expect(result).toBe('index.js');
  });

  it('VALID: {value: "file-with-dashes.ts"} => returns branded FileName', () => {
    const result = fileNameContract.parse('file-with-dashes.ts');

    expect(result).toBe('file-with-dashes.ts');
  });

  it('VALID: {value: "file_with_underscores.ts"} => returns branded FileName', () => {
    const result = fileNameContract.parse('file_with_underscores.ts');

    expect(result).toBe('file_with_underscores.ts');
  });

  it('INVALID_PATH_SEPARATOR: {value: "path/to/file.ts"} => throws error', () => {
    expect(() => {
      return fileNameContract.parse('path/to/file.ts');
    }).toThrow(/path separators/);
  });

  it('INVALID_PATH_SEPARATOR: {value: "path\\to\\file.ts"} => throws error', () => {
    expect(() => {
      return fileNameContract.parse('path\\to\\file.ts');
    }).toThrow(/path separators/);
  });

  it('INVALID_PATH_SEPARATOR: {value: "/file.ts"} => throws error', () => {
    expect(() => {
      return fileNameContract.parse('/file.ts');
    }).toThrow(/path separators/);
  });

  it('INVALID_PATH_SEPARATOR: {value: "\\file.ts"} => throws error', () => {
    expect(() => {
      return fileNameContract.parse('\\file.ts');
    }).toThrow(/path separators/);
  });

  it('EMPTY: {value: ""} => throws error', () => {
    expect(() => {
      return fileNameContract.parse('');
    }).toThrow(/cannot be empty/);
  });
});
