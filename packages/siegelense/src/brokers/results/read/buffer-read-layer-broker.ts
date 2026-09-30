/**
 * PURPOSE: Parses one of the three per-instance buffer files (`console.jsonl`, `network.jsonl`,
 * `ws.jsonl`) and applies a `results` query's `runId`/`step`/`where` narrowing over its lines
 * (chunk-03-read-path-and-perception.md §3.A). `sinceBoot: true` reads the WHOLE file regardless of
 * `runId` — the escape `since: 'boot'` exists for (spec line 2226) — and is the only way an entry
 * tagged `{runId: null, step: null}` (one that arrived between two runs) is ever included. A
 * missing buffer file (nothing of this kind was ever recorded) answers `[]` rather than throwing —
 * an instance whose walk never logged a console error has no `console.jsonl` to open. `where.level`
 * reuses `resultsStatics.patterns.consoleError`/`consoleWarning` — the SAME patterns
 * `runIndexComputeTransformer` classifies a console line with — so a `where: { level: 'error' }`
 * filter and the run index can never disagree about what an error line is; `level: 'info'` has no
 * dedicated pattern and passes every line through unfiltered, since no console-info classification
 * exists in this codebase. `where.steps` narrows to entries whose own `step` falls inside that range
 * (via `stepRangeExpandTransformer`) — an entry recorded with a null `step` (the untagged
 * between-runs case `since: 'boot'` reads) never matches a range, the same way it never matches a
 * bare `--step`. `where.nth` selects the row at that position AFTER every other filter has already
 * narrowed the set.
 *
 * USAGE:
 * await bufferReadLayerBroker({
 *   bufferPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/.../network.jsonl' }),
 *   runId: RunIdStub({ value: 'run_2' }), sinceBoot: false, step: StepIndexStub({ value: 7 }),
 *   where: null,
 * });
 * // Returns the ContentText JSON lines tagged run_2, step 7
 */

import type { SiegeRun } from '@dungeonmaster/shared/contracts';
import { readFileIfExists } from '#gateway/node/fs__promises';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import { bufferEntryContract } from '../../../contracts/buffer-entry/buffer-entry-contract';
import type { BufferEntry } from '../../../contracts/buffer-entry/buffer-entry-contract';
import { resultRowContract } from '../../../contracts/result-row/result-row-contract';
import type { ResultWhere } from '../../../contracts/result-where/result-where-contract';
import { resultsStatics } from '../../../statics/results/results-statics';
import { stepRangeExpandTransformer } from '../../../transformers/step-range-expand/step-range-expand-transformer';

export const bufferReadLayerBroker = async ({
  bufferPath,
  runId,
  sinceBoot,
  step,
  where,
}: {
  bufferPath: string;
  runId: SiegeRun['id'] | null;
  sinceBoot: boolean;
  step: number | null;
  where: ResultWhere | null;
}): Promise<readonly string[]> => {
  const content = await readFileIfExists(bufferPath);

  if (content === null) {
    return [];
  }

  const lines = content.split('\n').filter((line) => line.length > 0);

  const entries = lines.reduce<BufferEntry[]>((accumulated, line) => {
    try {
      accumulated.push(bufferEntryContract.parse(JSON.parse(line)));
    } catch {
      // A truncated final line from a mid-append crash — every earlier, complete entry still
      // answers.
    }
    return accumulated;
  }, []);

  const runFiltered = sinceBoot ? entries : entries.filter((entry) => entry.runId === runId);
  const stepFiltered =
    step === null ? runFiltered : runFiltered.filter((entry) => entry.step === step);

  const stepRange = where?.steps ?? null;
  const stepRangeFiltered =
    stepRange === null
      ? stepFiltered
      : stepFiltered.filter(
          (entry) =>
            entry.step !== null &&
            stepRangeExpandTransformer({ range: stepRange }).includes(entry.step),
        );

  const level = where?.level ?? null;
  const levelFiltered =
    level === null
      ? stepRangeFiltered
      : stepRangeFiltered.filter((entry) => {
          const isError = new RegExp(
            resultsStatics.patterns.consoleError.source,
            resultsStatics.patterns.consoleError.flags,
          ).test(entry.text);
          const isWarning = new RegExp(
            resultsStatics.patterns.consoleWarning.source,
            resultsStatics.patterns.consoleWarning.flags,
          ).test(entry.text);
          return level === 'error'
            ? isError
            : level === 'warn'
              ? isWarning
              : !isError && !isWarning;
        });

  const pathAndMethodFiltered =
    where === null || (where.path === null && where.method === null)
      ? levelFiltered
      : levelFiltered.filter((entry) => {
          const source: Record<string, unknown> = resultRowContract.parse(JSON.parse(entry.text));
          const url = typeof source.url === 'string' ? source.url : null;
          const method = typeof source.method === 'string' ? source.method : null;

          if (where.path !== null && !url?.includes(where.path)) {
            return false;
          }
          if (where.method !== null && method !== where.method) {
            return false;
          }
          return true;
        });

  const nth = where?.nth ?? null;
  const nthFiltered =
    nth === null
      ? pathAndMethodFiltered
      : pathAndMethodFiltered.filter((_unused, position) => position === nth);

  if (!sinceBoot) {
    return nthFiltered.map((entry) => entry.text);
  }

  // A boot-wide read spans every run, so each row names its own run and step.
  return nthFiltered.map((entry) => {
    const parsed = safeJsonParseTransformer({ value: entry.text });
    return parsed.ok && typeof parsed.value === 'object' && parsed.value !== null
      ? JSON.stringify({ run: entry.runId, step: entry.step, ...parsed.value })
      : entry.text;
  });
};
