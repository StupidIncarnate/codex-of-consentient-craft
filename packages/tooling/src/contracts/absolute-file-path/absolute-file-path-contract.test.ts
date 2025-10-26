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
});
