import { FileNameStub } from './file-name.stub';

describe('fileNameContract', () => {
  it('VALID: {value: "test-file.ts"} => returns branded FileName', () => {
    const result = FileNameStub({ value: 'test-file.ts' });

    expect(result).toBe('test-file.ts');
  });

  it('VALID: {value: "component.tsx"} => returns branded FileName', () => {
    const result = FileNameStub({ value: 'component.tsx' });

    expect(result).toBe('component.tsx');
  });

  it('VALID: {value: "index.js"} => returns branded FileName', () => {
    const result = FileNameStub({ value: 'index.js' });

    expect(result).toBe('index.js');
  });

  it('VALID: {value: "file-with-dashes.ts"} => returns branded FileName', () => {
    const result = FileNameStub({ value: 'file-with-dashes.ts' });

    expect(result).toBe('file-with-dashes.ts');
  });

  it('VALID: {value: "file_with_underscores.ts"} => returns branded FileName', () => {
    const result = FileNameStub({ value: 'file_with_underscores.ts' });

    expect(result).toBe('file_with_underscores.ts');
  });

  it('INVALID_PATH_SEPARATOR: {value: "path/to/file.ts"} => throws error', () => {
    expect(() => {
      return FileNameStub({ value: 'path/to/file.ts' });
    }).toThrow(/path separators/u);
  });

  it('INVALID_PATH_SEPARATOR: {value: "path\\to\\file.ts"} => throws error', () => {
    expect(() => {
      return FileNameStub({ value: 'path\\to\\file.ts' });
    }).toThrow(/path separators/u);
  });

  it('INVALID_PATH_SEPARATOR: {value: "/file.ts"} => throws error', () => {
    expect(() => {
      return FileNameStub({ value: '/file.ts' });
    }).toThrow(/path separators/u);
  });

  it('INVALID_PATH_SEPARATOR: {value: "\\file.ts"} => throws error', () => {
    expect(() => {
      return FileNameStub({ value: '\\file.ts' });
    }).toThrow(/path separators/u);
  });

  it('EMPTY: {value: ""} => throws error', () => {
    expect(() => {
      return FileNameStub({ value: '' });
    }).toThrow(/cannot be empty/u);
  });
});
