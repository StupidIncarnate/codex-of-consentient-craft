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
import type {
  AddQuestInput,
  AddQuestResult,
  GuildId,
  SessionId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import { questCreateBroker } from '../create/quest-create-broker';

export const questUserAddBroker = async ({
  input,
  guildId,
  sessionId,
}: {
  input: AddQuestInput;
  guildId: GuildId;
  sessionId?: SessionId;
}): Promise<AddQuestResult> => {
  try {
    const questId = questIdContract.parse(crypto.randomUUID());

    // The create-time seed role is quest-type specific: feature seeds a chaoswhisperer chat item;
    // bug-hunt seeds nothing (its execution graph is seeded at Start Quest). Null = no seed.
    const { initialWorkItemRole } = questTypeRegistryStatics[input.questType ?? 'feature'];

    const initialWorkItems: WorkItem[] =
      initialWorkItemRole === null
        ? []
        : [
            workItemContract.parse({
              id: crypto.randomUUID(),
              role: initialWorkItemRole,
              status: 'pending',
              spawnerType: 'agent',
              createdAt: new Date().toISOString(),
              dependsOn: [],
              maxAttempts: 1,
              ...(sessionId !== undefined && { sessionId }),
            }),
          ];

    const { questFilePath } = await questCreateBroker({
      questId,
      guildId,
      input,
      initialWorkItems,
    });

    const [seededItem] = initialWorkItems;

    return addQuestResultContract.parse({
      success: true,
      questId,
      questFolder: questId,
      filePath: questFilePath,
      // Surface the seed chat work item id (feature only) so chatSpawnBroker can hand it to the
      // launcher as `questWorkItemId` (addressability key) without re-fetching the quest.
      ...(seededItem === undefined ? {} : { chaoswhispererWorkItemId: seededItem.id }),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return addQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
};
