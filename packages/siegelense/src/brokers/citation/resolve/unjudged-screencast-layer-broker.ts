/**
 * PURPOSE: The half of the citation rule whose reader arrives LAST — an observable marked
 * `verifyByHuman` is a criterion no automated check can settle, so it is handed to a person as a
 * screencast and a question once the quest is over. `walkedNoteLayerBroker` releases an instance the
 * moment the quest goes terminal, and `cleanup` then ages every `.webm` out on
 * `pruneStatics.window.videoOlderThan` — two days, the shortest window in the tool — so without this
 * layer the recording is gone before its only reader opens the list. The reference therefore carries
 * the screencast's own absolute path in `why`: a run id is the only handle the tool offers and
 * nothing browses, so a sentence without the path is a claim rather than something a person can
 * open. A MISSING screencast resolves to `blocked`, never to silence: an empty `references` reads as
 * "nothing needs this" and lets the same sweep take the shots and the transcript too, while a
 * reference emitted over a file that is gone tells the person evidence exists and leaves them
 * hunting for it. Reach for this over `walkedNoteLayerBroker`: that one asks whether a walk is still
 * running, while this asks whether a person has still to judge what the walk recorded.
 *
 * USAGE:
 * await unjudgedScreencastLayerBroker({ instanceId, guildId, quest, questFilePath });
 * // Returns { references, blocked: null } — or { references: [], blocked: <why the pointer is bad> }
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  ContentText,
  GuildId,
  Quest,
} from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { citationKindContract } from '../../../contracts/citation-kind/citation-kind-contract';
import { citationReferenceContract } from '../../../contracts/citation-reference/citation-reference-contract';
import type { CitationReference } from '../../../contracts/citation-reference/citation-reference-contract';
import { instanceIdContract } from '../../../contracts/instance-id/instance-id-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { runIdContract } from '../../../contracts/run-id/run-id-contract';
import { pruneStatics } from '../../../statics/prune/prune-statics';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRunPathsFindBroker } from '../../locations/run-paths-find/locations-run-paths-find-broker';

const SCREENCAST_KIND = citationKindContract.parse('unjudged-screencast');

export const unjudgedScreencastLayerBroker = async ({
  instanceId,
  guildId,
  quest,
  questFilePath,
}: {
  instanceId: InstanceId;
  guildId: GuildId | null;
  quest: Quest;
  questFilePath: AbsoluteFilePath;
}): Promise<{ references: readonly CitationReference[]; blocked: ContentText | null }> => {
  const awaitingVerdict = [
    ...new Set(
      quest.flows.flatMap((flow) =>
        flow.nodes.flatMap((node) =>
          node.observables
            .filter((observable) => observable.verifyByHuman === true)
            .map((observable) => observable.id),
        ),
      ),
    ),
  ];

  if (awaitingVerdict.length === 0) {
    return { references: [], blocked: null };
  }

  const cited = quest.planningNotes.questNotes.flatMap((note) => {
    const noteInstance = instanceIdContract.safeParse(String(note.instanceId));
    const noteRun = runIdContract.safeParse(String(note.runId));

    if (
      !noteInstance.success ||
      !noteRun.success ||
      String(noteInstance.data) !== String(instanceId)
    ) {
      return [];
    }

    return [noteRun.data];
  });

  // A branded run id is a plain string at runtime, so the Set collapses two notes naming one run.
  // Two notes are two reasons to keep the same recording, not two recordings.
  const runIds = [...new Set(cited)];

  if (runIds.length === 0) {
    return { references: [], blocked: null };
  }

  const evidencePath = locationsInstanceEvidencePathFindBroker({ instanceId, guildId });
  const criteria = awaitingVerdict.join(', ');

  const found = await Promise.all(
    runIds.map(async (runId) => {
      const { shotsDir } = locationsRunPathsFindBroker({ evidencePath, runId });
      const entries = await fsReaddirAdapter({ dirPath: shotsDir });

      const screencasts = entries
        .filter((entryName) => String(entryName).endsWith(pruneStatics.assets.videoExtension))
        .map((entryName) =>
          absoluteFilePathContract.parse(pathJoinAdapter({ paths: [shotsDir, entryName] })),
        );

      return { runId, shotsDir, screencasts };
    }),
  );

  const rotted = found.find((run) => run.screencasts.length === 0);

  if (rotted !== undefined) {
    return {
      references: [],
      blocked: contentTextContract.parse(
        `quest ${quest.id} (${quest.status}) leaves ${criteria} for a person to settle off ` +
          `${rotted.runId} on ${instanceId}, and no ${pruneStatics.assets.videoExtension} is in ` +
          `${rotted.shotsDir} — refusing rather than handing that person a pointer to a recording ` +
          `that is not there.`,
      ),
    };
  }

  return {
    references: found.map((run) =>
      citationReferenceContract.parse({
        kind: SCREENCAST_KIND,
        instanceId,
        runId: run.runId,
        citingFile: questFilePath,
        why:
          `${run.runId} cited by ${criteria} on quest ${quest.id} (${quest.status}), which only a ` +
          `person can settle — held until that verdict is recorded: ${run.screencasts.join(', ')}`,
      }),
    ),
    blocked: null,
  };
};
