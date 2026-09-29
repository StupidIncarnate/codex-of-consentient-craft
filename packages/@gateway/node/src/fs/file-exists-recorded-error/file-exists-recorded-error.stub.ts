/**
 * PURPOSE: The EEXIST error an exclusive create (`writeFileExclusive`, the `'wx'` flag) raises
 * against a path that already exists, held as data so a caller's proxy can stage a lock that is
 * already taken without touching the disk. Its test provokes a real exclusive create against a
 * real file and asserts this stub matches it field for field, so the shape cannot drift from what
 * Node and the OS actually raise.
 *
 * USAGE:
 * const error = FileExistsRecordedErrorStub({ path: '/repo/.dungeonmaster/boot.lock' });
 * // Returns { message: "EEXIST: file already exists, open '/repo/.dungeonmaster/boot.lock'",
 * //   errno: -17, code: 'EEXIST', syscall: 'open', path }
 */
import { constants } from 'os';
import type { FsError } from '../is-fs-error/fs-error';

export const FileExistsRecordedErrorStub = ({
  path,
}: {
  path: string;
}): FsError & { errno: number } =>
  Object.assign(new Error(`EEXIST: file already exists, open '${path}'`), {
    errno: -constants.errno.EEXIST,
    code: 'EEXIST',
    syscall: 'open',
    path,
  });
