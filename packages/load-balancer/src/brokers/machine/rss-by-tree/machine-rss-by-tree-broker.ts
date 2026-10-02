/**
 * PURPOSE: Sums resident memory across a process-tree starting from a root process id — the
 * `rssMB` portion of a process-tree sample.
 * Reach for this over machineRssByPgidBroker when measuring the memory of a spawned command whose
 * children may not share a process group, or when isolating one subprocess hierarchy within a host.
 *
 * USAGE:
 * await machineRssByTreeBroker({ rootPid: 12345 });
 * // Returns the summed resident memory in whole megabytes, 0 if rootPid is not found, or null if /proc is unavailable
 */

import { readdirIfExists, readFileIfExists, statIfExists } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { isNativeError } from '#gateway/node/util__types';

import { machineStatics } from '../../../statics/machine/machine-statics';

export const machineRssByTreeBroker = async ({
  rootPid,
}: {
  rootPid: number;
}): Promise<number | null> => {
  const procRoot = machineStatics.procfs.root;

  const procRootStat = await statIfExists(procRoot);
  if (procRootStat === null) {
    return null;
  }

  const entries = (await readdirIfExists(procRoot)) ?? [];
  const pidEntries = entries.filter(
    (entry) => Number.isInteger(Number(entry)) && Number(entry) >= 1,
  );

  const parsedPids = await Promise.all(
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

      const closeParenIndex = statContent.lastIndexOf(')');
      if (closeParenIndex === -1) {
        return null;
      }

      const remainderFields = statContent
        .slice(closeParenIndex + 1)
        .trim()
        .split(' ');
      const ppid = Number(remainderFields[1]);

      return {
        pid: Number(pidEntry),
        ppid,
      };
    }),
  );

  const validPids = parsedPids.filter(
    (item): item is { pid: number; ppid: number } => item !== null,
  );

  const rootExists = validPids.some((item) => item.pid === rootPid);
  if (!rootExists) {
    return 0;
  }

  const childrenByParent = new Map<number, number[]>();
  for (const { pid, ppid } of validPids) {
    const list = childrenByParent.get(ppid);
    if (list === undefined) {
      childrenByParent.set(ppid, [pid]);
    } else {
      list.push(pid);
    }
  }

  const targetPids: number[] = [rootPid];
  for (const currentPid of targetPids) {
    const children = childrenByParent.get(currentPid) ?? [];
    for (const childPid of children) {
      if (targetPids.includes(childPid)) {
        continue;
      }
      targetPids.push(childPid);
    }
  }

  const residentPagesPerPid = await Promise.all(
    targetPids.map(async (pid) => {
      const statmPath = join(procRoot, String(pid), machineStatics.procfs.statm);

      const statmContent = await readFileIfExists(statmPath).catch((error: unknown) => {
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

      if (statmContent === null) {
        return 0;
      }

      const statmFields = statmContent.trim().split(' ');
      return Number(statmFields[machineStatics.procfs.rssPagesField]);
    }),
  );

  const totalPages = residentPagesPerPid.reduce((sum, pages) => sum + pages, 0);
  const totalBytes = totalPages * machineStatics.procfs.pageSizeBytes;

  return Math.floor(totalBytes / machineStatics.units.bytesPerMegabyte);
};
