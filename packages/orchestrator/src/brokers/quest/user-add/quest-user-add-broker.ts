/**
 * PURPOSE: User-initiated quest creation — generates a new UUID and produces the quest.json via questCreateBroker with the chaoswhisperer seed work item already attached, so a single persist + outbox event covers the full initial state.
 *
 * USAGE:
 * const result = await questUserAddBroker({ input: AddQuestInputStub({ title: 'Add Auth', userRequest: 'User wants...' }), guildId: GuildIdStub() });
 * // Returns: { success: true, questId: '<uuid>', questFolder: '<uuid>', filePath: '/path/to/quest.json' }
 *
 * WHY a single persist: an earlier two-phase persist (create empty, then modify to add
 * chaoswhisperer) caused a brief WS broadcast window where the quest had `workItems: []`,
 * during which the web's session-by-quest match would be empty and downstream tests racing
 * the quest-modified events would observe a transient "no chat session" state.
 */

import {
  addQuestResultContract,
  questIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { AddQuestInput, AddQuestResult, GuildId } from '@dungeonmaster/shared/contracts';

import { questCreateBroker } from '../create/quest-create-broker';

export const questUserAddBroker = async ({
  input,
  guildId,
}: {
  input: AddQuestInput;
  guildId: GuildId;
}): Promise<AddQuestResult> => {
  try {
    const questId = questIdContract.parse(crypto.randomUUID());

    const initialWorkItem = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'chaoswhisperer',
      status: 'pending',
      spawnerType: 'agent',
      createdAt: new Date().toISOString(),
      dependsOn: [],
      maxAttempts: 1,
    });

    const { questFilePath } = await questCreateBroker({
      questId,
      guildId,
      input,
      initialWorkItems: [initialWorkItem],
    });

    return addQuestResultContract.parse({
      success: true,
      questId,
      questFolder: questId,
      filePath: questFilePath,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return addQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
};
