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
 * exists in this codebase. `where.nth` selects the row at that position AFTER every other filter has
 * already narrowed the set.
 *
 * USAGE:
 * await bufferReadLayerBroker({
 *   bufferPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/.../network.jsonl' }),
 *   runId: RunIdStub({ value: 'run_2' }), sinceBoot: false, step: StepIndexStub({ value: 7 }),
 *   where: null,
 * });
 * // Returns the ContentText JSON lines tagged run_2, step 7
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { bufferEntryContract } from '../../../contracts/buffer-entry/buffer-entry-contract';
import type { BufferEntry } from '../../../contracts/buffer-entry/buffer-entry-contract';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { ResultWhere } from '../../../contracts/result-where/result-where-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import { resultsStatics } from '../../../statics/results/results-statics';

export const bufferReadLayerBroker = async ({
  bufferPath,
  runId,
  sinceBoot,
  step,
  where,
}: {
  bufferPath: AbsoluteFilePath;
  runId: RunId | null;
  sinceBoot: boolean;
  step: StepIndex | null;
  where: ResultWhere | null;
}): Promise<readonly ContentText[]> => {
  const content = await fsReadFileAdapter({ filePath: bufferPath }).catch((error: unknown) => {
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
  });

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

  const level = where?.level ?? null;
  const levelFiltered =
    level === null
      ? stepFiltered
      : stepFiltered.filter((entry) => {
          const patternStatic =
            level === 'error'
              ? resultsStatics.patterns.consoleError
              : level === 'warn'
                ? resultsStatics.patterns.consoleWarning
                : null;
          if (patternStatic === null) {
            return true;
          }
          return new RegExp(patternStatic.source, patternStatic.flags).test(entry.text);
        });

  const pathAndMethodFiltered =
    where === null || (where.path === null && where.method === null)
      ? levelFiltered
      : levelFiltered.filter((entry) => {
          const parsedUnknown: unknown = JSON.parse(entry.text);
          const source =
            typeof parsedUnknown === 'object' && parsedUnknown !== null
              ? (parsedUnknown as Record<PropertyKey, unknown>)
              : {};
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

  return nthFiltered.map((entry) => entry.text);
};
