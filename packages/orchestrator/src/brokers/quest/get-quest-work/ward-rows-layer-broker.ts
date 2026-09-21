/**
 * PURPOSE: Resolves the two rows a repair session works from — the failing ward result with its
 * check types and paths, and the riftcarver log path when the failure sits in the carve graph
 * instead. Split out of `questGetQuestWorkBroker` as a layer because it is the only half that reads
 * a result blob off disk, and the blob read is what turns "here are some files" into "run
 * `--only <checks>` over these files".
 *
 * USAGE:
 * await wardRowsLayerBroker({ questPath, quest });
 * // Returns { ward, riftcarverLogPath } — either row null when that graph produced no red
 *
 * WHICH RESULT IS "THE" RESULT IS `work-item-to-prompt-transformer`'s OWN RULE, unchanged: the most
 * recent entry carrying a non-zero `exitCode`. Re-deriving it differently here would hand a repair
 * session a different blob from the one its prompt names, and nothing would report the divergence.
 *
 * `failingCheckTypes` COMES OUT OF THE BLOB'S STRUCTURE, never off the file list. A repair builds
 * `--only <checks>` from those types; handed paths alone it guesses the check set, and a guess that
 * omits the failing check reports green over the red it was sent to fix.
 *
 * A BLOB THAT WILL NOT READ OR WILL NOT PARSE STILL YIELDS THE ROW, with empty lists. The
 * `wardResultId` and the `blobPath` are the parts a session cannot derive for itself; the lists are
 * a convenience it can rebuild by opening that path. Dropping the whole row over an unreadable file
 * would take the pointer down with the summary.
 *
 * A CARVE-ONLY FAILURE PRODUCES NO WARD BLOB AT ALL — same session, different graph — so a repair
 * that reads only `ward` gets `null` and has nothing to work from. That is why both rows are served
 * together and why neither is derived from the other.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, wardDetailContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath, Quest } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { questWorkViewContract } from '../../../contracts/quest-work-view/quest-work-view-contract';
import type { QuestWorkWard } from '../../../contracts/quest-work-view/quest-work-view-contract';
import { wardCheckTypeContract } from '../../../contracts/ward-check-type/ward-check-type-contract';

const GREEN_EXIT_CODE = 0;
const JSON_EXTENSION = '.json';
const LOG_EXTENSION = '.log';

export const wardRowsLayerBroker = async ({
  questPath,
  quest,
}: {
  questPath: AbsoluteFilePath;
  quest: Quest;
}): Promise<{ ward: QuestWorkWard | null; riftcarverLogPath: FilePath | null }> => {
  const failedCarve = [...quest.riftcarverResults]
    .filter((result) => result.exitCode !== GREEN_EXIT_CODE)
    .at(-1);

  const riftcarverLogPath =
    failedCarve === undefined
      ? null
      : filePathContract.parse(
          pathJoinAdapter({
            paths: [
              questPath,
              locationsStatics.quest.riftcarverResultsDir,
              `${String(failedCarve.id)}${LOG_EXTENSION}`,
            ],
          }),
        );

  const failedWard = [...quest.wardResults]
    .filter((result) => result.exitCode !== GREEN_EXIT_CODE)
    .at(-1);

  if (failedWard === undefined) {
    return { ward: null, riftcarverLogPath };
  }

  const blobPath = filePathContract.parse(
    pathJoinAdapter({
      paths: [
        questPath,
        locationsStatics.quest.wardResultsDir,
        `${String(failedWard.id)}${JSON_EXTENSION}`,
      ],
    }),
  );

  // Existence is probed FIRST because this package's fsReadFileAdapter rewraps every failure —
  // ENOENT included — into one generic Error, leaving no shape left to tell an absent blob from a
  // disk fault once it has thrown.
  const blobIsReadable = await fsIsAccessibleAdapter({ filePath: blobPath });
  const contents = blobIsReadable ? await fsReadFileAdapter({ filePath: blobPath }) : undefined;
  const parsed = wardDetailContract.safeParse(
    contents === undefined ? {} : JSON.parse(String(contents)),
  );

  const failingChecks = (parsed.success ? (parsed.data.checks ?? []) : []).filter(
    (check) => check.status === 'fail',
  );

  return {
    ward: questWorkViewContract.shape.ward.unwrap().parse({
      wardResultId: failedWard.id,
      runId: failedWard.runId ?? null,
      blobPath,
      failingCheckTypes: failingChecks.flatMap((check) =>
        check.checkType === undefined ? [] : [wardCheckTypeContract.parse(String(check.checkType))],
      ),
      // De-duplicated on first appearance: one file routinely carries several errors in one check,
      // and a repair opens a path once however many lines it broke on. A path ward wrote that does
      // not parse as a file path is dropped rather than throwing — the blob is still named by
      // `blobPath`, so nothing is lost that the session cannot reach.
      failingPaths: [
        ...new Set(
          failingChecks.flatMap((check) =>
            (check.projectResults ?? []).flatMap((project) =>
              (project.errors ?? []).flatMap((error) => {
                const parsedPath = filePathContract.safeParse(String(error.filePath ?? ''));

                return parsedPath.success ? [parsedPath.data] : [];
              }),
            ),
          ),
        ),
      ],
    }),
    riftcarverLogPath,
  };
};
