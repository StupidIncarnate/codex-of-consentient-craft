import { FileMissingErrorStub } from './file-missing-error.stub';

describe('FileMissingErrorStub', () => {
  it('VALID: {} => a real Error shaped like ENOENT, with no path', () => {
    const error = FileMissingErrorStub();

    expect({ code: error.code, path: error.path, syscall: error.syscall }).toStrictEqual({
      code: 'ENOENT',
      path: undefined,
      syscall: 'open',
    });
  });

  it('VALID: {path} => a real Error shaped like ENOENT for that path', () => {
    const error = FileMissingErrorStub({ path: '/tmp/missing.json' });

    expect({ code: error.code, path: error.path, syscall: error.syscall }).toStrictEqual({
      code: 'ENOENT',
      path: '/tmp/missing.json',
      syscall: 'open',
    });
  });
});
