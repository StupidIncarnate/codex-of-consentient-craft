import { filePathContract } from './file-path-contract';

describe('filePathContract', () => {
  it('VALID: {path: "/absolute/path.ts"} => parses successfully', () => {
    const result = filePathContract.parse('/absolute/path.ts');

    expect(result).toBe('/absolute/path.ts');
  });

  it('VALID: {path: "relative/path.ts"} => parses successfully', () => {
    const result = filePathContract.parse('relative/path.ts');

    expect(result).toBe('relative/path.ts');
  });

  it('INVALID: {path: 123} => throws ZodError', () => {
    expect(() => {
      return filePathContract.parse(123);
    }).toThrow();
  });
});
