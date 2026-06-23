/**
 * PURPOSE: Persists a quest modification via questModifyBroker and THROWS when the write does not
 * land, instead of swallowing the `{ success: false }` result questModifyBroker returns on any I/O
 * or validation failure. signal-back persistence must never report success when the work-item
 * transition was dropped — a silently-lost write strands the work item mid-flight and idles the
 * dispatch loop while every surface reports green.
 *
 * USAGE:
 * const result = await questModifyOrThrowBroker({ input: { questId, workItems: [...] } });
 * // Resolves the success ModifyQuestResult; throws Error(<modify error>) when the persist failed.
 */

import type { ModifyQuestInput, ModifyQuestResult } from '@dungeonmaster/shared/contracts';

import { questModifyBroker } from '../modify/quest-modify-broker';

export const questModifyOrThrowBroker = async ({
  input,
}: {
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => {
  const result = await questModifyBroker({ input });
  if (!result.success) {
    throw new Error(`quest modify failed to persist: ${result.error ?? 'unknown error'}`);
  }
  return result;
};
