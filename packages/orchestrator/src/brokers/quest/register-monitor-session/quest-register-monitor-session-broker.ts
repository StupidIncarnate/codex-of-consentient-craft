/**
 * PURPOSE: Captures the /dumpster-launch session's JSONL path into a caller-provided monitorSession facade so the JSONL watcher (step 7) can tail it for live web-UI chat streaming, and resets orphaned in_progress work items left behind by a prior killed launcher. Single-launcher semantics — at most one /dumpster-launch may register per server
 *
 * USAGE:
 * const ack = await questRegisterMonitorSessionBroker({ sessionFilePath, monitorSession });
 * // Returns: { status: 'registered', orphansReset } — orphansReset counts work items reset to pending across all approved/in_progress quests
 *
 * WHY monitorSession is a parameter: brokers cannot import from state/, so the caller
 * (MCP responder) supplies the real `monitorSessionState` methods; tests inject a stub.
 *
 * WHEN-TO-USE: Called by the MCP register-monitor-session tool when /dumpster-launch starts up.
 * WHEN-NOT-TO-USE: Anywhere else — this is the single entry point for monitor-session registration.
 */

import { pathDirnameAdapter } from '@dungeonmaster/shared/adapters';
import {
  modifyQuestInputContract,
  type FilePath,
  type Quest,
} from '@dungeonmaster/shared/contracts';
import {
  isActivelyExecutingQuestStatusGuard,
  isActiveWorkItemStatusGuard,
  isStartableQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import {
  registerMonitorSessionResultContract,
  type RegisterMonitorSessionResult,
} from '../../../contracts/register-monitor-session-result/register-monitor-session-result-contract';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const questRegisterMonitorSessionBroker = async ({
  sessionFilePath,
  monitorSession,
}: {
  sessionFilePath: FilePath;
  monitorSession: {
    isRegistered: () => boolean;
    register: (params: {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    }) => void;
  };
}): Promise<RegisterMonitorSessionResult> => {
  if (monitorSession.isRegistered()) {
    throw new Error(
      'A /dumpster-launch monitor session is already registered. Exactly one /dumpster-launch may run per server at a time — stop the existing launcher before starting a new one.',
    );
  }

  const projectDir = pathDirnameAdapter({ path: sessionFilePath });

  monitorSession.register({
    projectDir,
    sessionFilePath,
    registeredAt: isoTimestampContract.parse(new Date().toISOString()),
  });

  // Orphan reset: any work item left in_progress across approved/in_progress quests
  // belonged to a prior /dumpster-launch session that died. Reset them to pending so
  // the new launcher's get-next-step pass re-dispatches them.
  const guilds = await guildListBroker();

  const perGuildQuests = await Promise.all(
    guilds
      .filter((guildItem) => guildItem.valid)
      .map(async (guildItem) => {
        try {
          const quests = await questListBroker({ guildId: guildItem.id });
          return quests.filter(
            (quest: Quest) =>
              isStartableQuestStatusGuard({ status: quest.status }) ||
              isActivelyExecutingQuestStatusGuard({ status: quest.status }),
          );
        } catch {
          return [] as Quest[];
        }
      }),
  );

  const registrableQuests = perGuildQuests.flat();

  const orphanedTotals = await Promise.all(
    registrableQuests.map(async (quest) => {
      const orphanedItems = quest.workItems.filter((wi) =>
        isActiveWorkItemStatusGuard({ status: wi.status }),
      );
      if (orphanedItems.length === 0) {
        return 0;
      }

      const resetInput = modifyQuestInputContract.parse({
        questId: quest.id,
        workItems: orphanedItems.map((wi) => ({
          id: wi.id,
          status: 'pending' as const,
        })),
      });

      await questModifyBroker({ input: resetInput });
      return orphanedItems.length;
    }),
  );

  const orphansReset = orphanedTotals.reduce((sum, n) => sum + n, 0);

  return registerMonitorSessionResultContract.parse({
    status: 'registered',
    orphansReset,
  });
};
