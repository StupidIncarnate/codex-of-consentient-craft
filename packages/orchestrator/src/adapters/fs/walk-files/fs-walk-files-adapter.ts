/**
 * PURPOSE: Walks a directory tree once and returns every file with the chosen suffix, each with
 *   its mtime and size. Reach for this over fsReaddirAdapter when the caller needs to decide what
 *   CHANGED: readdir returns names only, so a caller composing it would issue one stat syscall per
 *   entry through a second adapter, and the transcript tree this scans holds ~2,200 files.
 *
 *   A directory that cannot be read is SKIPPED rather than thrown: this walks the user's whole
 *   Claude home, where a permission-denied corner is a normal condition and must not stop the
 *   measurement of everything else.
 *
 * USAGE:
 * fsWalkFilesAdapter({ rootPath, suffix: '.jsonl' });
 * // Returns ScannedFile[] — empty when the root does not exist
 */

import { readdirSync, statSync } from 'fs';
import type { Dirent } from 'fs';

import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  scannedFileContract,
  type ScannedFile,
} from '../../../contracts/scanned-file/scanned-file-contract';

export const fsWalkFilesAdapter = ({
  rootPath,
  suffix,
}: {
  rootPath: AbsoluteFilePath;
  suffix: string;
}): ScannedFile[] => {
  const found: ScannedFile[] = [];
  // An explicit stack rather than recursion: the tree is wide and shallow, and a stack keeps the
  // whole walk in one function, which the no-nested-functions rule requires anyway.
  const pending: AbsoluteFilePath[] = [rootPath];

  while (pending.length > 0) {
    const dir = pending.pop();
    if (dir === undefined) {
      break;
    }

    try {
      const entries: Dirent[] = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Joined by template rather than path.join DELIBERATELY. `join` is mocked process-wide by
        // pathJoinAdapter's proxy, whose one-shot stagings are consumed in call order by whichever
        // caller joins next — so a walk of a few hundred directories would eat the paths a
        // location broker staged for itself. Every path here is an absolute POSIX path under the
        // Claude home, which this repo already builds the same way in claudePathSlugEncoder.
        const full = absoluteFilePathContract.parse(`${dir}/${entry.name}`);

        if (entry.isDirectory()) {
          pending.push(full);
          continue;
        }

        if (!entry.isFile() || !entry.name.endsWith(suffix)) {
          continue;
        }

        try {
          const stat = statSync(full);
          found.push(
            scannedFileContract.parse({ path: full, mtimeMs: stat.mtimeMs, size: stat.size }),
          );
        } catch {
          // The file went away between readdir and stat — a live session rotating a transcript.
          continue;
        }
      }
    } catch {
      // Unreadable or absent directory — see the header. Measuring the rest is the whole job.
      continue;
    }
  }

  return found;
};
