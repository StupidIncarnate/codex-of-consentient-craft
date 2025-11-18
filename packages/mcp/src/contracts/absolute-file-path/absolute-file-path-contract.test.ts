import { absoluteFilePathContract as _absoluteFilePathContract } from './absolute-file-path-contract';
import { AbsoluteFilePathStub } from './absolute-file-path.stub';

describe('absoluteFilePathContract', () => {
  it('VALID: {value: "/test/path/to/file.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: '/test/path/to/file.ts' });

    expect(result).toBe('/test/path/to/file.ts');
  });

  it('VALID: {value: "./relative/path.ts"} => parses successfully', () => {
    const result = AbsoluteFilePathStub({ value: './relative/path.ts' });

    expect(result).toBe('./relative/path.ts');
  });

  it('VALID: uses default value when no value provided', () => {
    const result = AbsoluteFilePathStub();

    expect(result).toBe('/test/path/to/file.ts');
  });

  it('VALID: {value: "/home/user/project/file.ts"} => parses absolute path', () => {
    const result = AbsoluteFilePathStub({ value: '/home/user/project/file.ts' });

    expect(result).toBe('/home/user/project/file.ts');
  });
});
