import type { Dirent } from 'fs';

// A plain object carrying every member `fs.Dirent` declares, so it types as `Dirent` without a
// cast: `@types/node` declares no public constructor for the class, so a real one cannot be built.
export const DirentStub = ({
  name,
  kind,
  parentPath = '/stub',
}: {
  name: string;
  kind: 'file' | 'directory' | 'symlink' | 'other';
  parentPath?: string;
}): Dirent => ({
  name,
  parentPath,
  isFile: (): boolean => kind === 'file',
  isDirectory: (): boolean => kind === 'directory',
  isSymbolicLink: (): boolean => kind === 'symlink',
  isBlockDevice: (): boolean => false,
  isCharacterDevice: (): boolean => false,
  isFIFO: (): boolean => false,
  isSocket: (): boolean => kind === 'other',
});
