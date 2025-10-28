import { AbsolutePathStub } from './absolute-path.stub';

describe('absolutePathContract', () => {
  it('VALID: {value: "/home/user/project"} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/home/user/project' });

    expect(result).toBe('/home/user/project');
  });

  it('VALID: {value: "/tmp"} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/tmp' });

    expect(result).toBe('/tmp');
  });

  it('VALID: {value: "/var/www"} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/var/www' });

    expect(result).toBe('/var/www');
  });

  it('VALID: {value: root path} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/' });

    expect(result).toBe('/');
  });

  it('VALID: {value: deep nested path} => parses successfully', () => {
    const result = AbsolutePathStub({
      value: '/home/user/projects/codex/packages/mcp/src/contracts/absolute-path',
    });

    expect(result).toBe('/home/user/projects/codex/packages/mcp/src/contracts/absolute-path');
  });

  it('VALID: {value: path with file extension} => parses successfully', () => {
    const result = AbsolutePathStub({
      value: '/home/user/document.pdf',
    });

    expect(result).toBe('/home/user/document.pdf');
  });

  it('VALID: {value: path with spaces} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/home/user/My Documents/file.txt' });

    expect(result).toBe('/home/user/My Documents/file.txt');
  });

  it('VALID: {value: path with dots} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/home/user/.config/settings.json' });

    expect(result).toBe('/home/user/.config/settings.json');
  });

  it('VALID: {value: path with special characters} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/home/user/file-name_v2.0.ts' });

    expect(result).toBe('/home/user/file-name_v2.0.ts');
  });

  it('VALID: {value: empty string} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: Windows-style absolute path} => parses successfully', () => {
    const result = AbsolutePathStub({ value: 'C:/Users/user/project' });

    expect(result).toBe('C:/Users/user/project');
  });
});
