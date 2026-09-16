/**
 * PURPOSE: Sums resident memory across every `/proc/<pid>` whose `pgrp` matches one of the given
 * process-group ids — the `rssMB` half of a `status` answer's machine block
 * (chunk-03-read-path-and-perception.md §3.D: "RSS per process group is summed from
 * `/proc/<pid>/stat` (field `pgrp`) and `/proc/<pid>/statm` (resident pages)"). `null` means `/proc`
 * itself is absent — a platform fact, checked separately from an empty `pgids` list so the two never
 * collapse into the same answer: no children costs no memory (`0`), an unreadable machine costs
 * nothing to say (`null`). A pid that exits between the readdir and its own read is skipped rather
 * than treated as a failure — a process dying mid-walk is the ordinary case here. Any other read
 * failure (EACCES, a bad handle) propagates: swallowing it would make a status call under-report a
 * live instance's memory as smaller than it really is.
 *
 * USAGE:
 * await machineRssByPgidBroker({ pgids: [ProcessGroupIdStub()] });
 * // Returns the summed resident memory in whole megabytes, or null if /proc is unavailable
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { megabytesContract } from '../../../contracts/megabytes/megabytes-contract';
import type { Megabytes } from '../../../contracts/megabytes/megabytes-contract';
import type { ProcessGroupId } from '../../../contracts/process-group-id/process-group-id-contract';
import { machineStatics } from '../../../statics/machine/machine-statics';

export const machineRssByPgidBroker = async ({
  pgids,
}: {
  pgids: readonly ProcessGroupId[];
}): Promise<Megabytes | null> => {
  const procRoot = absoluteFilePathContract.parse(machineStatics.procfs.root);

  const procRootStat = await fsStatAdapter({ filePath: procRoot });
  if (procRootStat === null) {
    return null;
  }

  const entries = await fsReaddirAdapter({ dirPath: procRoot });
  // A pid directory is every entry that is purely a positive integer — 'vmstat', 'self', 'uptime'
  // and friends all fail Number.isInteger on their NaN conversion.
  const pidEntries = entries.filter(
    (entry) => Number.isInteger(Number(entry)) && Number(entry) >= 1,
  );
  const targetPgids = new Set(pgids.map((pgid) => Number(pgid)));

  const residentPagesPerPid = await Promise.all(
    pidEntries.map(async (pidEntry) => {
      const statPath = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [procRoot, String(pidEntry), machineStatics.procfs.stat] }),
      );

      const statContent = await fsReadFileAdapter({ filePath: statPath }).catch(
        (error: unknown) => {
          if (
            error !== null &&
            typeof error === 'object' &&
            errorIsNativeErrorAdapter({ value: error }) &&
            'cause' in error &&
            error.cause !== null &&
            typeof error.cause === 'object' &&
            errorIsNativeErrorAdapter({ value: error.cause }) &&
            'code' in error.cause &&
            error.cause.code === 'ENOENT'
          ) {
            return null;
          }
          throw error;
        },
      );

      if (statContent === null) {
        return 0;
      }

      // The comm field is everything between the FIRST '(' and the LAST ')' and may itself
      // contain spaces and parentheses, so only the text after the LAST ')' is safe to split on
      // whitespace. The two blank placeholders below are never read for their own value — they
      // exist only so `machineStatics.procfs.pgrpField` (counted from the man page's own
      // pid/comm/state/ppid/pgrp order) lands on the right index of `remainderFields` without a
      // magic-number offset.
      const closeParenIndex = statContent.lastIndexOf(')');
      const remainderFields = statContent
        .slice(closeParenIndex + 1)
        .trim()
        .split(' ');
      const fields = ['', '', ...remainderFields];
      const pgrp = Number(fields[machineStatics.procfs.pgrpField]);

      if (!targetPgids.has(pgrp)) {
        return 0;
      }

      const statmPath = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [procRoot, String(pidEntry), machineStatics.procfs.statm] }),
      );

      const statmContent = await fsReadFileAdapter({ filePath: statmPath }).catch(
        (error: unknown) => {
          if (
            error !== null &&
            typeof error === 'object' &&
            errorIsNativeErrorAdapter({ value: error }) &&
            'cause' in error &&
            error.cause !== null &&
            typeof error.cause === 'object' &&
            errorIsNativeErrorAdapter({ value: error.cause }) &&
            'code' in error.cause &&
            error.cause.code === 'ENOENT'
          ) {
            return null;
          }
          throw error;
        },
      );

      if (statmContent === null) {
        return 0;
      }

      const statmFields = statmContent.trim().split(' ');
      return Number(statmFields[machineStatics.procfs.rssPagesField]);
    }),
  );

  const totalPages = residentPagesPerPid.reduce((sum, pages) => sum + pages, 0);
  const totalBytes = totalPages * machineStatics.procfs.pageSizeBytes;

  return megabytesContract.parse(Math.floor(totalBytes / machineStatics.units.bytesPerMegabyte));
};
