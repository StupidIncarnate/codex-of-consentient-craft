/**
 * PURPOSE: Appends a `human-verdict` quest note for one `verifyByHuman` observable, persisting
 * through the same `questPersistBroker` path every quest mutation uses so the outbox fires
 * `quest-modified`. This is the write path a browser POST hits once a person judges a screencast —
 * see `unjudgedScreencastLayerBroker` (`@dungeonmaster/siegelense`), the reader this note releases.
 *
 * USAGE:
 * await questHumanVerdictRecordBroker({ questId, unitId, outcome: 'met', reason: 'Watched the clip end to end.' });
 * // Returns { quest } — the persisted quest, carrying the new note — or throws when unitId names no
 * // verifyByHuman observable
 *
 * WHEN-TO-USE: The one write a person's browser click makes. This bypasses `questModifyBroker`'s
 * per-status allowlist on purpose: a `verifyByHuman` criterion is judged AT QUEST END, and that
 * allowlist closes `planningNotes` at `complete` (`questStatusInputAllowlistStatics.complete` carries
 * `allowedPlanningNotesFields: []` — only `in_progress` carries `'all'`) — the same reason
 * `questOperationsUpdateBroker` bypasses it for the ledger. Reach for `questModifyBroker` for every
 * note kind an execution agent writes.
 *
 * REPLACE, NOT APPEND, on a second verdict for the same `unitId`: the note's `id` is deterministic
 * (`human-verdict-<unitId>`), so restating a verdict upserts onto the same entry — the same shape
 * `questNoteIdContract`'s own header documents ("a role writing a note names it after what the note
 * is about, so a later pass re-stating the same open question upserts onto it instead of appending a
 * duplicate"). The hold this releases only checks that a matching-id note EXISTS, so either
 * semantic would work mechanically; replace is what keeps the questNotes list from growing every
 * time a person re-watches the clip and changes their mind.
 *
 * `workItemId` IS OMITTED. A person clicking a button in the browser has no work item, and
 * `questNoteContract.workItemId` is `.nullish()` for exactly this kind. Stamping a real-looking
 * random UUID would misdirect a reader who tries to follow up with "the work item that wrote this",
 * and a fabricated sentinel (a prior version of this broker used the nil UUID,
 * `00000000-0000-0000-0000-000000000000`) is a fake value in a real field — indistinguishable from a
 * genuine id to a reader that does not know the sentinel's exact string. Omitting the key entirely is
 * the honest shape: a reader checks presence instead.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  questContract,
  questIdContract,
  questNoteContract,
} from '@dungeonmaster/shared/contracts';
import type { Quest, QuestNote } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questPersistBroker } from '../persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../with-modify-lock/quest-with-modify-lock-broker';

const JSON_INDENT_SPACES = 2;

export const questHumanVerdictRecordBroker = async ({
  questId,
  unitId,
  outcome,
  reason,
}: {
  questId: string;
  unitId: string;
  outcome: 'met' | 'not-met';
  reason: string;
}): Promise<{ quest: Quest }> =>
  questWithModifyLockBroker({
    questId: questIdContract.parse(questId),
    run: async (): Promise<{ quest: Quest }> => {
      const { questPath } = await questFindQuestPathBroker({
        questId: questIdContract.parse(questId),
      });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
      );
      const quest = await questLoadBroker({ questFilePath });

      // A branded observable id is a plain string at runtime, so `String()` on both sides is what
      // lets this compare against the raw `unitId` the browser sent — the same comparison
      // `unjudgedScreencastLayerBroker` makes against a `human-verdict` note's `unitId`.
      const [match] = quest.flows
        .flatMap((flow) => flow.nodes.map((node) => ({ flow, node })))
        .flatMap(({ flow, node }) =>
          node.observables
            .filter((observable) => String(observable.id) === unitId)
            .map((observable) => ({ flow, observable })),
        );

      if (match === undefined) {
        throw new Error(`Quest ${questId} has no observable named "${unitId}".`);
      }

      if (match.observable.verifyByHuman !== true) {
        throw new Error(
          `Observable "${unitId}" on quest ${questId} is not flagged verifyByHuman — a human ` +
            'verdict can only be recorded against a verifyByHuman: true observable.',
        );
      }

      const at = new Date().toISOString();
      const note: QuestNote = {
        id: questNoteContract.shape.id.parse(`human-verdict-${unitId}`),
        kind: questNoteContract.shape.kind.parse('human-verdict'),
        role: questNoteContract.shape.role.parse('operator'),
        flowId: questNoteContract.shape.flowId.parse(match.flow.id),
        unitId: questNoteContract.shape.unitId.parse(unitId),
        outcome: questNoteContract.shape.outcome.parse(outcome),
        summary: questNoteContract.shape.summary.parse(
          `${match.observable.description}: ${outcome === 'met' ? 'confirmed' : 'rejected'}`,
        ),
        detail: questNoteContract.shape.detail.parse(reason),
        at: questNoteContract.shape.at.parse(at),
      };

      const nextQuestNotes = [
        ...quest.planningNotes.questNotes.filter((existing) => existing.id !== note.id),
        note,
      ];

      const mutated = questContract.parse({
        ...quest,
        planningNotes: { ...quest.planningNotes, questNotes: nextQuestNotes },
        updatedAt: at,
      });

      const contents = fileContentsContract.parse(
        JSON.stringify(mutated, null, JSON_INDENT_SPACES),
      );
      await questPersistBroker({ questFilePath, contents, questId: mutated.id });

      return { quest: mutated };
    },
  });
