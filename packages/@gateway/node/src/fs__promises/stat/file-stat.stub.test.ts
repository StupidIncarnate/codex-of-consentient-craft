import { FileStatStub } from './file-stat.stub';

describe('FileStatStub', () => {
  it('VALID: {} => defaults to a file, size 0, modified and created at epoch 0', () => {
    expect(FileStatStub()).toStrictEqual({
      kind: 'file',
      sizeBytes: 0,
      modifiedAtMs: 0,
      createdAtMs: 0,
    });
  });

  it('VALID: {kind, sizeBytes, modifiedAtMs, createdAtMs} => carries every field through unchanged', () => {
    expect(
      FileStatStub({
        kind: 'directory',
        sizeBytes: 4096,
        modifiedAtMs: 1700000000000,
        createdAtMs: 1600000000000,
      }),
    ).toStrictEqual({
      kind: 'directory',
      sizeBytes: 4096,
      modifiedAtMs: 1700000000000,
      createdAtMs: 1600000000000,
    });
  });
});
