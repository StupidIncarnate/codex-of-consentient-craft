/**
 * PURPOSE: The line ward prints when a `--committed`/`--uncommitted` scope names a path that is no
 * longer on disk. Reach for this over `pathNotFoundStatics` whenever the missing path came from git
 * rather than from the caller: `--committed` diffs merge-base against HEAD alone, with no idea what
 * the working tree currently holds, so a file this branch's own commits already added or modified
 * stays in its answer even after an uncommitted `rm` deletes it — and staging that deletion changes
 * nothing, because `--committed` never reads the index either. Dropping the path is correct there;
 * printing this line is what keeps the drop from being silent.
 *
 * USAGE:
 * import { gitScopeDroppedPathsStatics } from '../../statics/git-scope-dropped-paths/git-scope-dropped-paths-statics';
 * process.stdout.write(`${gitScopeDroppedPathsStatics.heading}\n${dropped.join('\n')}\n\n`);
 */

export const gitScopeDroppedPathsStatics = {
  heading: 'ward: dropped from the git-derived scope — no longer on disk:',
} as const;
