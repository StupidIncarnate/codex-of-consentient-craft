/**
 * PURPOSE: Rejoins the per-line chat entries a `spawnerType: 'command'` work item streams into one
 * entry per contiguous run, because the line split is a STREAMING artefact rather than the output's
 * real shape — a command emits one entry per line so the panel fills as the child writes, and the
 * renderer draws one labelled, bordered, padded block per entry. A 1200-line build therefore drew
 * 1200 `RIFTCARVER` headers, one per line, blank lines included. Reach for this over
 * `mergeToolEntriesTransformer`, which pairs a tool_use with its result; this one concatenates
 * plain text that was never meant to be separate messages.
 *
 * A run also breaks on a change of `source`, so sub-agent output never lands inside a session block.
 *
 * USAGE:
 * mergeCommandOutputEntriesTransformer({ entries });
 * // ['— build pass 1/3 —', '', '> tsc'] as three entries becomes ONE whose content is
 * //   '— build pass 1/3 —\n\n> tsc', keeping the first entry's uuid and timestamp
 */

import { chatEntryContract, type ChatEntry } from '@dungeonmaster/shared/contracts';

import { isMergeableCommandOutputEntryGuard } from '../../guards/is-mergeable-command-output-entry/is-mergeable-command-output-entry-guard';

const LINE_SEPARATOR = '\n';
const SINGLETON_RUN = 1;
const LAST_OFFSET = 1;

export const mergeCommandOutputEntriesTransformer = ({
  entries,
}: {
  entries: ChatEntry[];
}): ChatEntry[] => {
  const runs: ChatEntry[][] = [];

  for (const entry of entries) {
    const openRun = runs[runs.length - LAST_OFFSET];
    const head = openRun?.[0];
    const extendsOpenRun =
      openRun !== undefined &&
      isMergeableCommandOutputEntryGuard({ entry }) &&
      isMergeableCommandOutputEntryGuard({ entry: head }) &&
      head?.source === entry.source;

    if (extendsOpenRun) {
      openRun.push(entry);
      continue;
    }

    runs.push([entry]);
  }

  // The run's own first entry is what the merged block inherits — uuid included. The binding keys
  // entries by uuid for dedup and sorts by timestamp, so reusing the FIRST one keeps the block
  // sorted where its output actually started rather than where it happened to stop.
  return runs.flatMap((run) => {
    const [first] = run;
    if (first === undefined) {
      return [];
    }

    return run.length === SINGLETON_RUN
      ? [first]
      : [
          chatEntryContract.parse({
            ...first,
            content: run
              .map((entry) => ('content' in entry ? String(entry.content) : ''))
              .join(LINE_SEPARATOR),
          }),
        ];
  });
};
