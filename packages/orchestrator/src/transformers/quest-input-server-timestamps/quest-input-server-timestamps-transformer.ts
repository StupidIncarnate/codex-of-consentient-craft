/**
 * PURPOSE: Puts the server's clock reading on every timestamp a modify-quest payload is WRITING,
 * discarding whatever the caller sent. It runs on the INPUT rather than on the merged quest, and
 * that is the whole point: the merge carries untouched entries through unchanged, so a write that
 * only appends one note leaves the other blight-ledger and operation-plan entries reading the
 * moment they were really made, instead of re-dating the whole quest on every unrelated call.
 *
 * USAGE:
 * questInputServerTimestampsTransformer({ input: validated, at });
 * // Returns: the same input, re-validated, with every blight-ledger `createdAt`, quest-note `at`
 * // and operation-plan `at` it carries replaced by `at`
 *
 * An LLM has no reliable clock. Every one of these fields was agent-authored before this existed,
 * and an audited quest carried notes whose timestamps drifted 50 minutes into a future they never
 * reached. `flows` carries no timestamp of its own to stamp — a unit's mark lives on
 * `workItem.observations[]`, which `quest-work` writes and stamps separately — so this transformer
 * reads only `planningNotes`.
 */
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput, UnitObservation } from '@dungeonmaster/shared/contracts';

export const questInputServerTimestampsTransformer = ({
  input,
  at,
}: {
  input: ModifyQuestInput;
  at: UnitObservation['at'];
}): ModifyQuestInput => {
  const { planningNotes } = input;

  // Nothing this payload carries has a timestamp, so it round-trips untouched rather than paying a
  // second whole-input parse.
  if (planningNotes === undefined) {
    return input;
  }

  return modifyQuestInputContract.parse({
    ...input,
    planningNotes: {
      ...planningNotes,
      ...(planningNotes.blightLedger === undefined
        ? {}
        : {
            blightLedger: planningNotes.blightLedger.map((entry) => ({
              ...entry,
              createdAt: at,
            })),
          }),
      ...(planningNotes.questNotes === undefined
        ? {}
        : {
            questNotes: planningNotes.questNotes.map((note) => ({ ...note, at })),
          }),
      ...(planningNotes.operationPlans === undefined
        ? {}
        : {
            operationPlans: planningNotes.operationPlans.map((plan) => ({ ...plan, at })),
          }),
    },
  });
};
