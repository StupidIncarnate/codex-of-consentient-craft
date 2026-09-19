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

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { citationKindContract } from '../../../contracts/citation-kind/citation-kind-contract';
import { citationReferenceContract } from '../../../contracts/citation-reference/citation-reference-contract';
import type { CitationReference } from '../../../contracts/citation-reference/citation-reference-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { runIdContract } from '../../../contracts/run-id/run-id-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { citationStatics } from '../../../statics/citation/citation-statics';
import { locationsCitationQuestPlansPathFindBroker } from '../../locations/citation-quest-plans-path-find/locations-citation-quest-plans-path-find-broker';

const PRELUDE_KIND = citationKindContract.parse('verified-prelude');

export const verifiedPreludeLayerBroker = async ({
  instanceId,
  worktreePath,
  runIds,
}: {
  instanceId: InstanceId;
  worktreePath: AbsoluteFilePath;
  runIds: readonly RunId[];
}): Promise<readonly CitationReference[]> => {
  const plansDir = locationsCitationQuestPlansPathFindBroker({ worktreePath });
  const topEntries = await fsReaddirAdapter({ dirPath: plansDir });

  const nested = await Promise.all(
    topEntries.map(async (name) => {
      if (String(name).endsWith(citationStatics.questPlans.preludeExtension)) {
        return [];
      }

      const nestedDir = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [plansDir, name] }),
      );

      // A plan directory holds markdown files and per-quest subdirectories. Anything else is a
      // file this scan has no use for, and ENOTDIR is how the OS says so — every other read
      // failure propagates, because a plan directory that cannot be read is a question this
      // resolver must not answer with silence.
      const entries = await fsReaddirAdapter({ dirPath: nestedDir }).catch((error: unknown) => {
        if (
          error !== null &&
          typeof error === 'object' &&
          errorIsNativeErrorAdapter({ value: error }) &&
          'code' in error &&
          error.code === 'ENOTDIR'
        ) {
          return [];
        }
        throw error;
      });

      return entries
        .filter((entryName) =>
          String(entryName).endsWith(citationStatics.questPlans.preludeExtension),
        )
        .map((entryName) =>
          absoluteFilePathContract.parse(pathJoinAdapter({ paths: [nestedDir, entryName] })),
        );
    }),
  );

  const planFiles = [
    ...topEntries
      .filter((name) => String(name).endsWith(citationStatics.questPlans.preludeExtension))
      .map((name) => absoluteFilePathContract.parse(pathJoinAdapter({ paths: [plansDir, name] }))),
    ...nested.flat(),
  ];

  const found = await Promise.all(
    planFiles.map(async (filePath) => {
      const contents = await fsReadFileAdapter({ filePath });

      const citingLine = String(contents)
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
          runId: citedRun === undefined ? null : runIdContract.parse(String(citedRun)),
          citingFile: filePath,
          why: contentTextContract.parse(
            `${citedRun === undefined ? String(instanceId) : String(citedRun)} cited by a ` +
              `${citationStatics.questPlans.verifiedMarker} prelude in ${filePath}`,
          ),
        }),
      ];
    }),
  );

  return found.flat();
};
