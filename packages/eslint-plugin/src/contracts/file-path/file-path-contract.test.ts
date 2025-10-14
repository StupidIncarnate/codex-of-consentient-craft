import { FilePathStub } from './file-path.stub';

describe('FilePathStub', () => {
  it('VALID: {value: "/absolute/path.ts"} => returns branded FilePath', () => {
    const result = FilePathStub({ value: '/absolute/path.ts' });

    expect(result).toBe('/absolute/path.ts');
  });

  it('VALID: {value: "relative/path.ts"} => returns branded FilePath', () => {
    const result = FilePathStub({ value: 'relative/path.ts' });

    expect(result).toBe('relative/path.ts');
  });

  it('VALID: {} => returns default FilePath', () => {
    const result = FilePathStub();

    expect(result).toBe('/test/file.ts');
  });
});
