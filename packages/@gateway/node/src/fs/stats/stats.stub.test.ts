import { Stats } from 'fs';
import { StatsStub } from './stats.stub';

describe('StatsStub', () => {
  it('VALID: {} => defaults to a file, size 0, modified at epoch 0', () => {
    const stats = StatsStub();

    expect({
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
      isBlockDevice: stats.isBlockDevice(),
      isCharacterDevice: stats.isCharacterDevice(),
      isFIFO: stats.isFIFO(),
      isSocket: stats.isSocket(),
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      mtime: stats.mtime,
    }).toStrictEqual({
      isFile: true,
      isDirectory: false,
      isSymbolicLink: false,
      isBlockDevice: false,
      isCharacterDevice: false,
      isFIFO: false,
      isSocket: false,
      size: 0,
      mtimeMs: 0,
      mtime: new Date(0),
    });
  });

  it('VALID: {kind: directory} => isDirectory is true and every other kind check is false', () => {
    const stats = StatsStub({ kind: 'directory' });

    expect({
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
    }).toStrictEqual({ isFile: false, isDirectory: true, isSymbolicLink: false });
  });

  it('VALID: {kind: symlink} => isSymbolicLink is true and every other kind check is false', () => {
    const stats = StatsStub({ kind: 'symlink' });

    expect({
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
    }).toStrictEqual({ isFile: false, isDirectory: false, isSymbolicLink: true });
  });

  it('VALID: {kind: other} => every kind check is false', () => {
    const stats = StatsStub({ kind: 'other' });

    expect({
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
    }).toStrictEqual({ isFile: false, isDirectory: false, isSymbolicLink: false });
  });

  it('VALID: {sizeBytes, modifiedAtMs} => carries them across every size and time field', () => {
    const stats = StatsStub({ sizeBytes: 42, modifiedAtMs: 1700000000000 });

    expect({
      size: stats.size,
      atimeMs: stats.atimeMs,
      mtimeMs: stats.mtimeMs,
      ctimeMs: stats.ctimeMs,
      birthtimeMs: stats.birthtimeMs,
      atime: stats.atime,
      mtime: stats.mtime,
      ctime: stats.ctime,
      birthtime: stats.birthtime,
    }).toStrictEqual({
      size: 42,
      atimeMs: 1700000000000,
      mtimeMs: 1700000000000,
      ctimeMs: 1700000000000,
      birthtimeMs: 1700000000000,
      atime: new Date(1700000000000),
      mtime: new Date(1700000000000),
      ctime: new Date(1700000000000),
      birthtime: new Date(1700000000000),
    });
  });

  it('VALID: {modifiedAtMs, createdAtMs} => birth fields carry createdAtMs, not modifiedAtMs', () => {
    const stats = StatsStub({ modifiedAtMs: 1700000000000, createdAtMs: 1600000000000 });

    expect({
      mtimeMs: stats.mtimeMs,
      mtime: stats.mtime,
      birthtimeMs: stats.birthtimeMs,
      birthtime: stats.birthtime,
    }).toStrictEqual({
      mtimeMs: 1700000000000,
      mtime: new Date(1700000000000),
      birthtimeMs: 1600000000000,
      birthtime: new Date(1600000000000),
    });
  });

  it('VALID: {} => is not instanceof fs.Stats, since it is built by hand, not through the constructor', () => {
    const stats = StatsStub();

    expect(stats instanceof Stats).toBe(false);
  });
});
