/**
 * PURPOSE: Reads what a heartbeat's recorded pgids still are — alive or gone (`processIsAliveAdapter`)
 * and the command line of whichever `/proc/<pid>` still carries that pgrp — for the `orphans` list of
 * a `status` answer (chunk-03-read-path-and-perception.md §3.D: "carries pgids and whether each is
 * still alive, because that is what a session needs to decide whether to reap"). `cmd` is `null`
 * when nothing in `/proc` carries the pgid — the ordinary outcome once the group has been reaped, not
 * a fetch failure — and a pid that exits mid-scan is skipped rather than treated as an error, the
 * same rule `machineRssByPgidBroker` applies to its own `/proc` walk.
 *
 * USAGE:
 * await orphanReadBroker({ pgids: [ProcessGroupIdStub()] });
 * // Returns one OrphanReading per pgid, in the same order; cmd is null once nothing in /proc holds it
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { processIsAliveAdapter } from '../../../adapters/process/is-alive/process-is-alive-adapter';
import { orphanReadingContract } from '../../../contracts/orphan-reading/orphan-reading-contract';
import type { OrphanReading } from '../../../contracts/orphan-reading/orphan-reading-contract';
import type { ProcessGroupId } from '../../../contracts/process-group-id/process-group-id-contract';
import { machineStatics } from '../../../statics/machine/machine-statics';

export const orphanReadBroker = async ({
  pgids,
}: {
  pgids: readonly ProcessGroupId[];
}): Promise<readonly OrphanReading[]> => {
  const procRoot = absoluteFilePathContract.parse(machineStatics.procfs.root);
  const entries = await fsReaddirAdapter({ dirPath: procRoot });
  // A pid directory is every entry that is purely a positive integer — 'vmstat', 'self', 'uptime'
  // and friends all fail Number.isInteger on their NaN conversion.
  const pidEntries = entries.filter(
    (entry) => Number.isInteger(Number(entry)) && Number(entry) >= 1,
  );

  const statResults = await Promise.all(
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
        return null;
      }

      // Same last-')' read as machineRssByPgidBroker — the comm field may itself contain spaces
      // and parentheses, and the two blank placeholders exist only so
      // `machineStatics.procfs.pgrpField` lands on the right index without a magic-number offset.
      const closeParenIndex = statContent.lastIndexOf(')');
      const remainderFields = statContent
        .slice(closeParenIndex + 1)
        .trim()
        .split(' ');
      const fields = ['', '', ...remainderFields];

      return { pid: String(pidEntry), pgrp: Number(fields[machineStatics.procfs.pgrpField]) };
    }),
  );

  return Promise.all(
    pgids.map(async (pgid) => {
      const alive = processIsAliveAdapter({ pgid });
      // .find() naturally returns the FIRST array entry that matches — readdir order — so this
      // is "the first matching /proc/<pid>/cmdline" without any extra bookkeeping.
      const match = statResults.find((result) => result !== null && result.pgrp === Number(pgid));

      if (match === undefined || match === null) {
        return orphanReadingContract.parse({ pgid, cmd: null, alive });
      }

      const cmdlinePath = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [procRoot, match.pid, machineStatics.procfs.cmdline] }),
      );

      const cmdlineContent = await fsReadFileAdapter({ filePath: cmdlinePath }).catch(
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

      // /proc/<pid>/cmdline separates argv entries with NUL bytes, not spaces. Written as the
      // explicit '\u0000' escape rather than a literal control character in source, so the
      // separator stays visible to an editor, a diff, and a reformatter instead of surviving
      // only by accident.
      const cmd =
        cmdlineContent === null
          ? null
          : contentTextContract.parse(
              cmdlineContent
                .split('\u0000')
                .filter((token) => token !== '')
                .join(' '),
            );

      return orphanReadingContract.parse({ pgid, cmd, alive });
    }),
  );
};
