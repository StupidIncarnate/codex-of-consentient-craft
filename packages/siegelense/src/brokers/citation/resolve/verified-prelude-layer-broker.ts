/**
 * PURPOSE: The `VERIFIED` half of the citation rule — a prelude carries a line naming the run that
 * PROVED it ("not a claim that it should work: the id of a run where it did",
 * siege-verification-remainder.md line 942), and a fixer re-running that prelude needs that run's
 * evidence to still be there. The line names a RUN and not an instance, so the quest scopes the
 * search and the run id identifies the hit: a `VERIFIED` line citing `run_7` protects an instance
 * whose own tree holds a `run_7`, and a line naming the instance id outright is the stronger form
 * and matches too. At most ONE reference per file, because ten `VERIFIED` lines in one prelude are
 * one reason, not ten. Reach for this over `walkedNoteLayerBroker`: that one reads the durable
 * record on the quest, while this reads the per-quest plan files that are wiped when a quest ends.
 *
 * USAGE:
 * await verifiedPreludeLayerBroker({ instanceId, worktreePath, runIds });
 * // Returns one CitationReference per citing plan file, or [] when nothing there names this instance
 */

import { join } from '#gateway/node/path';
import { siegeRunContract } from '@dungeonmaster/shared/contracts';
import type { SiegeInstance, SiegeRun } from '@dungeonmaster/shared/contracts';

import { readFile, readdirIfExists } from '#gateway/node/fs__promises';
import { isNativeError } from '#gateway/node/util__types';
import { citationKindContract } from '../../../contracts/citation-kind/citation-kind-contract';
import { citationReferenceContract } from '../../../contracts/citation-reference/citation-reference-contract';
import type { CitationReference } from '../../../contracts/citation-reference/citation-reference-contract';
import { citationStatics } from '../../../statics/citation/citation-statics';
import { locationsCitationQuestPlansPathFindBroker } from '../../locations/citation-quest-plans-path-find/locations-citation-quest-plans-path-find-broker';

const PRELUDE_KIND = citationKindContract.parse('verified-prelude');

export const verifiedPreludeLayerBroker = async ({
  instanceId,
  worktreePath,
  runIds,
}: {
  instanceId: SiegeInstance['id'];
  worktreePath: string;
  runIds: readonly SiegeRun['id'][];
}): Promise<readonly CitationReference[]> => {
  const plansDir = locationsCitationQuestPlansPathFindBroker({ worktreePath });
  const topEntries = (await readdirIfExists(plansDir)) ?? [];

  const nested = await Promise.all(
    topEntries.map(async (name) => {
      if (name.endsWith(citationStatics.questPlans.preludeExtension)) {
        return [];
      }

      const nestedDir = join(plansDir, name);

      // A plan directory holds markdown files and per-quest subdirectories. Anything else is a
      // file this scan has no use for, and ENOTDIR is how the OS says so — every other read
      // failure propagates, because a plan directory that cannot be read is a question this
      // resolver must not answer with silence.
      const entries =
        (await readdirIfExists(nestedDir).catch((error: unknown) => {
          if (
            error !== null &&
            typeof error === 'object' &&
            isNativeError(error) &&
            'code' in error &&
            error.code === 'ENOTDIR'
          ) {
            return [];
          }
          throw error;
        })) ?? [];

      return entries
        .filter((entryName) => entryName.endsWith(citationStatics.questPlans.preludeExtension))
        .map((entryName) => join(nestedDir, entryName));
    }),
  );

  const planFiles = [
    ...topEntries
      .filter((name) => name.endsWith(citationStatics.questPlans.preludeExtension))
      .map((name) => join(plansDir, name)),
    ...nested.flat(),
  ];

  const found = await Promise.all(
    planFiles.map(async (filePath) => {
      const contents = await readFile(filePath);

      const citingLine = contents
        .split('\n')
        .find(
          (line) =>
            line.includes(citationStatics.questPlans.verifiedMarker) &&
            (line.includes(String(instanceId)) ||
              runIds.some((runId) =>
                new RegExp(`(^|[^0-9A-Za-z_])${String(runId)}([^0-9]|$)`, 'u').test(line),
              )),
        );

      if (citingLine === undefined) {
        return [];
      }

      const citedRun = runIds.find((runId) =>
        new RegExp(`(^|[^0-9A-Za-z_])${String(runId)}([^0-9]|$)`, 'u').test(citingLine),
      );

      return [
        citationReferenceContract.parse({
          kind: PRELUDE_KIND,
          instanceId,
          runId: citedRun === undefined ? null : siegeRunContract.shape.id.parse(String(citedRun)),
          citingFile: filePath,
          why:
            `${citedRun === undefined ? String(instanceId) : String(citedRun)} cited by a ` +
            `${citationStatics.questPlans.verifiedMarker} prelude in ${filePath}`,
        }),
      ];
    }),
  );

  return found.flat();
};
