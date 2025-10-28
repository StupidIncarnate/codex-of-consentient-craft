import { FilePathStub } from './file-path.stub';

describe('filePathContract', () => {
  it('VALID: {value: "/test/path"} => parses successfully', () => {
    const result = FilePathStub({ value: '/test/path' });

    expect(result).toBe('/test/path');
  });

  it('VALID: {value: relative path} => parses successfully', () => {
    const result = FilePathStub({ value: 'src/contracts/file-path' });

    expect(result).toBe('src/contracts/file-path');
  });

  it('VALID: {value: absolute path with nested directories} => parses successfully', () => {
    const result = FilePathStub({
      value: '/home/user/projects/codex/packages/mcp/src/contracts',
    });

    expect(result).toBe('/home/user/projects/codex/packages/mcp/src/contracts');
  });

  it('VALID: {value: path with file extension} => parses successfully', () => {
    const result = FilePathStub({ value: 'packages/standards/testing-standards.md' });

    expect(result).toBe('packages/standards/testing-standards.md');
  });

  it('VALID: {value: path with spaces} => parses successfully', () => {
    const result = FilePathStub({ value: '/path/with spaces/file name.ts' });

    expect(result).toBe('/path/with spaces/file name.ts');
  });

  it('VALID: {value: empty string} => parses successfully', () => {
    const result = FilePathStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: single directory} => parses successfully', () => {
    const result = FilePathStub({ value: 'src' });

    expect(result).toBe('src');
  });

  it('VALID: {value: path with dots} => parses successfully', () => {
    const result = FilePathStub({ value: '../packages/mcp/./src' });

    expect(result).toBe('../packages/mcp/./src');
  });
});
