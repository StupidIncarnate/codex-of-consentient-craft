/**
 * PURPOSE: Reads what a heartbeat's recorded pgids still are — alive or gone (`processIsAliveBroker`)
 * and the command line of whichever `/proc/<pid>` still carries that pgrp — for the `orphans` list of
 * a `status` answer (chunk-03-read-path-and-perception.md §3.D: "carries pgids and whether each is
 * still alive, because that is what a session needs to decide whether to reap"). `cmd` is `null`
 * when nothing in `/proc` carries the pgid — the ordinary outcome once the group has been reaped, not
 * a fetch failure — and a pid that exits mid-scan is skipped rather than treated as an error, the
 * same rule `machineRssByPgidBroker` applies to its own `/proc` walk: `ENOENT` when the directory is
 * already gone before the read opens it, `ESRCH` when the process exits in the gap between that open
 * succeeding and the read completing (the gap a busy machine's scheduler contention widens enough to
 * hit — see that broker's header for the full mechanism). Both mean "gone", not "failed", so both are
 * skipped; any other read failure (EACCES, a bad handle) still propagates.
 *
 * USAGE:
 * await orphanReadBroker({ pgids: [ProcessGroupIdStub()] });
 * // Returns one OrphanReading per pgid, in the same order; cmd is null once nothing in /proc holds it
 */

import { readdirIfExists, readFileIfExists } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { isNativeError } from '#gateway/node/util__types';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { processIsAliveBroker } from '../../process/is-alive/process-is-alive-broker';
import { orphanReadingContract } from '../../../contracts/orphan-reading/orphan-reading-contract';
import type { OrphanReading } from '../../../contracts/orphan-reading/orphan-reading-contract';
import type { ProcessGroupId } from '../../../contracts/process-group-id/process-group-id-contract';
import { machineStatics } from '../../../statics/machine/machine-statics';

export const orphanReadBroker = async ({
  pgids,
}: {
  pgids: readonly ProcessGroupId[];
}): Promise<readonly OrphanReading[]> => {
  const procRoot = machineStatics.procfs.root;
  const entries = (await readdirIfExists(procRoot)) ?? [];
  // A pid directory is every entry that is purely a positive integer — 'vmstat', 'self', 'uptime'
  // and friends all fail Number.isInteger on their NaN conversion.
  const pidEntries = entries.filter(
    (entry) => Number.isInteger(Number(entry)) && Number(entry) >= 1,
  );

  const statResults = await Promise.all(
    pidEntries.map(async (pidEntry) => {
      const statPath = join(procRoot, pidEntry, machineStatics.procfs.stat);

      const statContent = await readFileIfExists(statPath).catch((error: unknown) => {
        if (
          error !== null &&
          typeof error === 'object' &&
          isNativeError(error) &&
          'code' in error &&
          error.code === 'ESRCH'
        ) {
          return null;
        }
        throw error;
      });

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

      return { pid: pidEntry, pgrp: Number(fields[machineStatics.procfs.pgrpField]) };
    }),
  );

  return Promise.all(
    pgids.map(async (pgid) => {
      const alive = processIsAliveBroker({ pgid });
      // .find() naturally returns the FIRST array entry that matches — readdir order — so this
      // is "the first matching /proc/<pid>/cmdline" without any extra bookkeeping.
      const match = statResults.find((result) => result !== null && result.pgrp === Number(pgid));

      if (match === undefined || match === null) {
        return orphanReadingContract.parse({ pgid, cmd: null, alive });
      }

      const cmdlinePath = join(procRoot, match.pid, machineStatics.procfs.cmdline);

      const cmdlineContent = await readFileIfExists(cmdlinePath).catch((error: unknown) => {
        if (
          error !== null &&
          typeof error === 'object' &&
          isNativeError(error) &&
          'code' in error &&
          error.code === 'ESRCH'
        ) {
          return null;
        }
        throw error;
      });

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
