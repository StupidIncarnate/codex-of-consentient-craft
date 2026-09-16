/**
 * PURPOSE: Reports free disk space under `dirPath` in whole megabytes — the `freeDiskMB` half of a
 * `status` answer's machine block (siegelense-tooling.md line 1171), read via `fs.statfs` rather than
 * a shelled-out `df` so no child process sits on this path. Answers `null` only when this Node
 * runtime has no `fs.statfs` at all; a real statfs failure (a bad path, a filesystem that refuses it)
 * still throws — "disk unreadable" and "disk full" are two different reasons for a caller to worry,
 * and collapsing them onto one `null` answers the wrong question the day something acts on it. The
 * unavailability branch has no test: proving it means making `statfs` stop being a function on the
 * shared `fs/promises` module, and every mechanism available outside a guard/contract file either
 * keeps it a function (`registerMock`) or is itself banned here (`Reflect.set`).
 *
 * USAGE:
 * await fsStatfsAdapter({ dirPath: AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster' }) });
 * // Returns free space in whole megabytes, or null if fs.statfs is unavailable on this runtime
 */

import { statfs } from 'fs/promises';
import { megabytesContract } from '../../../contracts/megabytes/megabytes-contract';
import type { Megabytes } from '../../../contracts/megabytes/megabytes-contract';
import { machineStatics } from '../../../statics/machine/machine-statics';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsStatfsAdapter = async ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): Promise<Megabytes | null> => {
  // Checked through `unknown` rather than directly on `statfs` — its imported type is always a
  // function, so TypeScript would otherwise see this as an always-false condition even though the
  // proxy genuinely replaces the runtime value to prove this branch.
  const statfsFn: unknown = statfs;
  if (typeof statfsFn !== 'function') {
    return null;
  }

  const stats = await statfs(dirPath);
  const freeBytes = stats.bavail * stats.bsize;

  return megabytesContract.parse(Math.floor(freeBytes / machineStatics.units.bytesPerMegabyte));
};
