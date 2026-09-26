/**
 * PURPOSE: Walks a directory tree once and returns every file with the chosen suffix, each with
 * its size and mtime. Reach for this over `readdirSync` when the caller needs to decide what
 * CHANGED across a whole tree, since composing readdir would cost one stat syscall per entry at
 * the call site instead of here.
 *
 * A subtree that cannot be read (ENOENT, EACCES) is SKIPPED rather than thrown — this is built to
 * walk a whole home directory, where one unreadable corner is routine and must not stop the
 * measurement of everything else. A file that disappears between listing and stat is skipped too.
 *
 * USAGE:
 * walkFilesSync({ rootPath: '/home/user/.claude/projects', suffix: '.jsonl' });
 * // Returns { path, sizeBytes, modifiedAtMs }[] — empty when the root cannot be read
 */
import { readdirSync, statSync } from 'fs';

export interface WalkedFile {
  path: string;
  sizeBytes: number;
  modifiedAtMs: number;
}

export const walkFilesSync = ({
  rootPath,
  suffix,
}: {
  rootPath: string;
  suffix: string;
}): WalkedFile[] => {
  const found: WalkedFile[] = [];
  // An explicit stack rather than recursion: the tree this walks is wide, and a stack keeps the
  // whole walk in one function.
  const pending: string[] = [rootPath];

  while (pending.length > 0) {
    const dir = pending.pop();
    if (dir === undefined) {
      break;
    }

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const full = `${dir}/${entry.name}`;

        if (entry.isDirectory()) {
          pending.push(full);
          continue;
        }

        if (!entry.isFile() || !entry.name.endsWith(suffix)) {
          continue;
        }

        try {
          const stat = statSync(full);
          found.push({ path: full, sizeBytes: stat.size, modifiedAtMs: stat.mtimeMs });
        } catch {
          // The file went away between readdir and stat — a live process rotating a file.
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
