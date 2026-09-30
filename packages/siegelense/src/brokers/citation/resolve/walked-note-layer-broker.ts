/**
 * PURPOSE: The `WALKED` half of the citation rule — a path a walk drove is recorded as a `walked`
 * note on `quest.planningNotes.questNotes`, and while that quest is OPEN the shots and transcripts
 * that walk produced are what the adversarial phase reads next (siegelense-tooling.md lines
 * 265-268). This is the row an issue-only retention rule leaves out, and leaving it out unprotects
 * exactly the CLEAN walk's baselines, because a clean walk raises no issue. The note's `instanceId`
 * is the SHARED brand, so it is re-parsed through this package's own `instanceIdContract` before
 * being compared against a registry id — the standard move for carrying a branded value across a
 * package boundary, and what `siegeInstanceIdContract`'s own header asks this resolver to do. A
 * TERMINAL quest cites nothing: the walk is over and the record has stopped being something anyone
 * is about to act on. Reach for this over `verifiedPreludeLayerBroker`: that one reads per-quest
 * plan FILES, which are wiped when a quest ends, while this reads the durable record that outlives
 * it.
 *
 * USAGE:
 * walkedNoteLayerBroker({ instanceId, quest, questFilePath });
 * // Returns one CitationReference per walked note naming this instance, or [] on a closed quest
 */

import type { Quest, SiegeInstance } from '@dungeonmaster/shared/contracts';
import { siegeInstanceContract, siegeRunContract } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { citationKindContract } from '../../../contracts/citation-kind/citation-kind-contract';
import { citationReferenceContract } from '../../../contracts/citation-reference/citation-reference-contract';
import type { CitationReference } from '../../../contracts/citation-reference/citation-reference-contract';
import { citationStatics } from '../../../statics/citation/citation-statics';

const WALKED_KIND = citationKindContract.parse('walked-note');

export const walkedNoteLayerBroker = ({
  instanceId,
  quest,
  questFilePath,
}: {
  instanceId: SiegeInstance['id'];
  quest: Quest;
  questFilePath: string;
}): readonly CitationReference[] => {
  if (questStatusMetadataStatics.statuses[quest.status].isTerminal) {
    return [];
  }

  return quest.planningNotes.questNotes.flatMap((note) => {
    if (note.kind !== citationStatics.walked.noteKind) {
      return [];
    }

    const noteInstance = siegeInstanceContract.shape.id.safeParse(String(note.instanceId));

    if (!noteInstance.success || String(noteInstance.data) !== String(instanceId)) {
      return [];
    }

    const noteRun = siegeRunContract.shape.id.safeParse(String(note.runId));
    const runLabel = noteRun.success ? String(noteRun.data) : 'every run';

    return [
      citationReferenceContract.parse({
        kind: WALKED_KIND,
        instanceId,
        runId: noteRun.success ? noteRun.data : null,
        citingFile: questFilePath,
        why: `${runLabel} cited by a WALKED note on open quest ${quest.id} (${quest.status}) in ${questFilePath}`,
      }),
    ];
  });
};
