import { DirentStub } from './dirent.stub';

describe('DirentStub', () => {
  it('VALID: {kind: file} => answers only isFile true, under the default parent path', () => {
    const dirent = DirentStub({ name: 'a.ts', kind: 'file' });

    expect({
      name: dirent.name,
      parentPath: dirent.parentPath,
      isFile: dirent.isFile(),
      isDirectory: dirent.isDirectory(),
      isSymbolicLink: dirent.isSymbolicLink(),
      isBlockDevice: dirent.isBlockDevice(),
      isCharacterDevice: dirent.isCharacterDevice(),
      isFIFO: dirent.isFIFO(),
      isSocket: dirent.isSocket(),
    }).toStrictEqual({
      name: 'a.ts',
      parentPath: '/stub',
      isFile: true,
      isDirectory: false,
      isSymbolicLink: false,
      isBlockDevice: false,
      isCharacterDevice: false,
      isFIFO: false,
      isSocket: false,
    });
  });

  it('VALID: {kind: directory, parentPath} => answers only isDirectory true, under that parent path', () => {
    const dirent = DirentStub({ name: 'src', kind: 'directory', parentPath: '/repo' });

    expect({
      parentPath: dirent.parentPath,
      isFile: dirent.isFile(),
      isDirectory: dirent.isDirectory(),
      isSymbolicLink: dirent.isSymbolicLink(),
      isSocket: dirent.isSocket(),
    }).toStrictEqual({
      parentPath: '/repo',
      isFile: false,
      isDirectory: true,
      isSymbolicLink: false,
      isSocket: false,
    });
  });

  it('VALID: {kind: symlink} => answers only isSymbolicLink true', () => {
    const dirent = DirentStub({ name: 'link', kind: 'symlink' });

    expect([
      dirent.isFile(),
      dirent.isDirectory(),
      dirent.isSymbolicLink(),
      dirent.isSocket(),
    ]).toStrictEqual([false, false, true, false]);
  });

  it('VALID: {kind: other} => answers none of file, directory or symlink', () => {
    const dirent = DirentStub({ name: 'sock', kind: 'other' });

    expect([
      dirent.isFile(),
      dirent.isDirectory(),
      dirent.isSymbolicLink(),
      dirent.isSocket(),
    ]).toStrictEqual([false, false, false, true]);
  });
});
