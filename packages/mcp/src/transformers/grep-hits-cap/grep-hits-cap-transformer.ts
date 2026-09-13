/**
 * PURPOSE: Bounds one file's share of a grep result, so a dense match cannot print the file it
 * lives in. Reach for this rather than slicing the hit array at the call site: the markers it
 * emits are not hit lines, carry no line number of their own, and the budget-exhausted form has
 * to reach the file's LABEL rather than the lines beneath it.
 *
 * USAGE:
 * grepHitsCapTransformer({ hits, budgetRemaining: 8000 });
 * // Returns { labelSuffix: '', lines: [':14  if (a) {', '… 9 more matching lines in this file'] }
 */
import { cappedGrepHitsContract } from '../../contracts/capped-grep-hits/capped-grep-hits-contract';
import type { CappedGrepHits } from '../../contracts/capped-grep-hits/capped-grep-hits-contract';
import type { GrepHit } from '../../contracts/grep-hit/grep-hit-contract';
import { treeOutputContract } from '../../contracts/tree-output/tree-output-contract';
import type { TreeOutput } from '../../contracts/tree-output/tree-output-contract';
import { discoverOutputCapStatics } from '../../statics/discover-output-cap/discover-output-cap-statics';

export const grepHitsCapTransformer = ({
  hits,
  budgetRemaining,
}: {
  hits: readonly GrepHit[];
  budgetRemaining: number;
}): CappedGrepHits => {
  const { maxRunLines, maxFileLines } = discoverOutputCapStatics.grepOutput;

  if (hits.length === 0) {
    return cappedGrepHitsContract.parse({ labelSuffix: '', lines: [] });
  }

  // Past the budget a file still has to appear, or a rename sweep loses the only record that it
  // matches at all. Its count is what survives instead of its lines.
  if (budgetRemaining <= 0) {
    return cappedGrepHitsContract.parse({
      labelSuffix: `  — ${hits.length} matching lines`,
      lines: [],
    });
  }

  // Consecutive line numbers are ONE run: `context` bridges neighbouring matches, so an identifier
  // that is dense in the file it belongs to arrives as a single unbroken block.
  const runs: GrepHit[][] = [];
  for (const hit of hits) {
    const openRun = runs[runs.length - 1];
    const previous = openRun?.[openRun.length - 1];

    if (
      openRun !== undefined &&
      previous !== undefined &&
      Number(hit.line) === Number(previous.line) + 1
    ) {
      openRun.push(hit);
    } else {
      runs.push([hit]);
    }
  }

  const runLines: TreeOutput[] = [];
  for (const run of runs) {
    for (const kept of run.slice(0, maxRunLines)) {
      runLines.push(treeOutputContract.parse(`:${kept.line}  ${kept.text}`));
    }

    const droppedFromRun = run.length - maxRunLines;
    const firstDropped = run[maxRunLines];
    const lastDropped = run[run.length - 1];

    if (droppedFromRun > 0 && firstDropped !== undefined && lastDropped !== undefined) {
      runLines.push(
        treeOutputContract.parse(
          `… ${droppedFromRun} more lines (:${firstDropped.line}-:${lastDropped.line})`,
        ),
      );
    }
  }

  if (runLines.length <= maxFileLines) {
    return cappedGrepHitsContract.parse({ labelSuffix: '', lines: runLines });
  }

  // The kept slice can hold run markers as well as hit lines, so the per-file count is measured
  // against the hit lines actually shown rather than against the slice length.
  const keptLines = runLines.slice(0, maxFileLines);
  const shownHitLines = keptLines.filter((line) => String(line).startsWith(':')).length;

  return cappedGrepHitsContract.parse({
    labelSuffix: '',
    lines: [
      ...keptLines,
      treeOutputContract.parse(`… ${hits.length - shownHitLines} more matching lines in this file`),
    ],
  });
};
