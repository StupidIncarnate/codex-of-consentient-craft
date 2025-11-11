import { filePathContract } from './file-path-contract';
import { FilePathStub } from './file-path.stub';

describe('filePathContract', () => {
  it('VALID: {value: "/test/file.ts"} => parses successfully', () => {
    const result = FilePathStub({ value: '/test/file.ts' });

    expect(result).toBe('/test/file.ts');
  });

  it('VALID: {value: absolute path} => parses successfully', () => {
    const result = FilePathStub({ value: '/home/user/projects/file.ts' });

    expect(result).toBe('/home/user/projects/file.ts');
  });

  it('VALID: {value: relative path} => parses successfully', () => {
    const result = FilePathStub({ value: 'src/contracts/file.ts' });

    expect(result).toBe('src/contracts/file.ts');
  });

  describe('invalid input', () => {
    it('INVALID: {number instead of string} => throws validation error', () => {
      expect(() => {
        return filePathContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });
  });
});
