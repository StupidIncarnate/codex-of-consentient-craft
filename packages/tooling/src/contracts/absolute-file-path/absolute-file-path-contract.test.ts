import { AbsoluteFilePathStub } from './absolute-file-path.stub';

describe('absoluteFilePathContract', () => {
  it('VALID: {value: "/home/user/file.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/home/user/file.ts' });

    expect(result).toBe('/home/user/file.ts');
  });

  it('VALID: {value: "/absolute/path/to/file.tsx"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/absolute/path/to/file.tsx' });

    expect(result).toBe('/absolute/path/to/file.tsx');
  });

  it('VALID: {value: "/src/index.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/src/index.ts' });

    expect(result).toBe('/src/index.ts');
  });

  it('VALID: {value: "/"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/' });

    expect(result).toBe('/');
  });

  it('VALID: {value: "/a"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/a' });

    expect(result).toBe('/a');
  });

  it('VALID: {value: "/path/with spaces/file.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/path/with spaces/file.ts' });

    expect(result).toBe('/path/with spaces/file.ts');
  });

  it('VALID: {value: "/path-with-dashes/file_with_underscores.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({
      value: '/path-with-dashes/file_with_underscores.ts',
    });

    expect(result).toBe('/path-with-dashes/file_with_underscores.ts');
  });

  it('VALID: {value: "/path.with.dots/@scoped/package.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/path.with.dots/@scoped/package.ts' });

    expect(result).toBe('/path.with.dots/@scoped/package.ts');
  });

  it('VALID: {value: "/путь/файл.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/путь/файл.ts' });

    expect(result).toBe('/путь/файл.ts');
  });

  it('VALID: {value: "/路径/文件.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/路径/文件.ts' });

    expect(result).toBe('/路径/文件.ts');
  });

  it('VALID: {value: very long path} => parses successfully', () => {
    const longPath = `${'/very/long/path/that/has/many/segments/'.repeat(10)}file.ts`;
    const result = AbsoluteFilePathStub({ value: longPath });

    expect(result).toBe(longPath);
  });

  it('VALID: {value: "/path/with/numbers123/file456.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/path/with/numbers123/file456.ts' });

    expect(result).toBe('/path/with/numbers123/file456.ts');
  });

  it('VALID: {value: "/UPPERCASE/MixedCase/file.TS"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/UPPERCASE/MixedCase/file.TS' });

    expect(result).toBe('/UPPERCASE/MixedCase/file.TS');
  });
});
