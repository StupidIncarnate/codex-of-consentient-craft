import * as barrel from './index';
import { readFile } from './read-file';
import { readFileIfExists } from './read-file-if-exists';
import { readFileBytes } from './read-file-bytes';
import { readFileFromOffset } from './read-file-from-offset';
import { readJsonFile } from './read-json-file';
import { readJsonFileIfExists } from './read-json-file-if-exists';
import { readNonEmptyLines } from './read-non-empty-lines';
import { pathExists } from './path-exists';
import { stat } from './stat';
import { statIfExists } from './stat-if-exists';
import { diskFreeBytes } from './disk-free-bytes';
import { readdir } from './readdir';
import { readdirIfExists } from './readdir-if-exists';
import { readdirEntries } from './readdir-entries';
import { readlink } from './readlink';
import { readlinkIfLink } from './readlink-if-link';
import { realpath } from './realpath';
import { isFsError } from '../is-fs-error';
import { FsErrorStub } from '../fs-error.stub';
import { writeFile } from './write-file';
import { writeFileAtomic } from './write-file-atomic';
import { writeFileExclusive } from './write-file-exclusive';
import { writeFileCreatingParent } from './write-file-creating-parent';
import { writeFileBytes } from './write-file-bytes';
import { writeFileFromBase64 } from './write-file-from-base64';
import { appendFile } from './append-file';
import { appendLinesCreatingParent } from './append-lines-creating-parent';
import { ensureDir } from './ensure-dir';
import { rm } from './rm';
import { rename } from './rename';
import { unlink } from './unlink';
import { unlinkIfExists } from './unlink-if-exists';
import { copyFile } from './copy-file';
import { copyDirContents } from './copy-dir-contents';
import { symlink } from './symlink';

const EXPECTED_EXPORTS: readonly { name: string; direct: unknown }[] = [
  { name: 'readFile', direct: readFile },
  { name: 'readFileIfExists', direct: readFileIfExists },
  { name: 'readFileBytes', direct: readFileBytes },
  { name: 'readFileFromOffset', direct: readFileFromOffset },
  { name: 'readJsonFile', direct: readJsonFile },
  { name: 'readJsonFileIfExists', direct: readJsonFileIfExists },
  { name: 'readNonEmptyLines', direct: readNonEmptyLines },
  { name: 'pathExists', direct: pathExists },
  { name: 'stat', direct: stat },
  { name: 'statIfExists', direct: statIfExists },
  { name: 'diskFreeBytes', direct: diskFreeBytes },
  { name: 'readdir', direct: readdir },
  { name: 'readdirIfExists', direct: readdirIfExists },
  { name: 'readdirEntries', direct: readdirEntries },
  { name: 'readlink', direct: readlink },
  { name: 'readlinkIfLink', direct: readlinkIfLink },
  { name: 'realpath', direct: realpath },
  { name: 'isFsError', direct: isFsError },
  { name: 'FsErrorStub', direct: FsErrorStub },
  { name: 'writeFile', direct: writeFile },
  { name: 'writeFileAtomic', direct: writeFileAtomic },
  { name: 'writeFileExclusive', direct: writeFileExclusive },
  { name: 'writeFileCreatingParent', direct: writeFileCreatingParent },
  { name: 'writeFileBytes', direct: writeFileBytes },
  { name: 'writeFileFromBase64', direct: writeFileFromBase64 },
  { name: 'appendFile', direct: appendFile },
  { name: 'appendLinesCreatingParent', direct: appendLinesCreatingParent },
  { name: 'ensureDir', direct: ensureDir },
  { name: 'rm', direct: rm },
  { name: 'rename', direct: rename },
  { name: 'unlink', direct: unlink },
  { name: 'unlinkIfExists', direct: unlinkIfExists },
  { name: 'copyFile', direct: copyFile },
  { name: 'copyDirContents', direct: copyDirContents },
  { name: 'symlink', direct: symlink },
];

describe('@dungeonmaster/node/fs/promises barrel', () => {
  it.each(EXPECTED_EXPORTS)(
    'VALID: {export: $name} => the barrel re-exports the same function reference',
    ({ name, direct }) => {
      const fromBarrel = (barrel as Record<string, unknown>)[name];

      expect(fromBarrel).toBe(direct);
    },
  );
});
