/**
 * PURPOSE: Layer of `quest-monitor-watcher-start-broker` — rebuilds the
 * caller-supplied `activeAgentIdsByQuest` Map by scanning every valid guild for
 * actively-executing quests and collecting `agentId` from each in-progress work
 * item. Quests that disappear (deleted/abandoned/completed since last refresh) are
 * dropped from the Map. Caller invokes this on watcher startup and on each 1s
 * poll tick so the watcher's `isAgentIdActive` predicate stays current as
 * get-agent-prompt stamps new agentIds and signal-back terminates old ones.
 *
 * USAGE:
 * const { droppedQuestIds } = await refreshActiveAgentIdsLayerBroker({ activeAgentIdsByQuest });
 * // Mutates the Map in place. Returns the QuestIds that were removed from the Map this pass.
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isAnyAgentRunningQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';

export const refreshActiveAgentIdsLayerBroker = async ({
  activeAgentIdsByQuest,
  agentIdToWorkItemId,
}: {
  activeAgentIdsByQuest: Map<QuestId, Set<AgentId>>;
  // Optional reverse map rebuilt in lockstep with `activeAgentIdsByQuest`: each active
  // work item's `agentId` → its `id`. The watcher stamps `workItemId` on every sub-agent
  // chat-output emit from this map so the web can route each Task-dispatched row's
  // transcript to its own execution row (two sub-agents share one parent sessionId, so
  // sessionId alone can't disambiguate). Omitted by tests that only assert the agentId set.
  agentIdToWorkItemId?: Map<AgentId, QuestWorkItemId>;
}): Promise<{ droppedQuestIds: readonly QuestId[] }> => {
  const guilds = await guildListBroker();
  const seenQuestIds = new Set<QuestId>();

  const validGuilds = guilds.filter((guild) => guild.valid);
  const perGuildQuests = await Promise.all(
    validGuilds.map(async (guild) => {
      try {
        return await questListBroker({ guildId: guild.id });
      } catch {
        return [];
      }
    }),
  );

  // Rebuilt fully each pass from the current active set, so stale agentId→workItemId
  // pairs (work item reached terminal) drop automatically. Cleared after the awaits so
  // the emit closure never reads a half-empty map during the network fetch window.
  agentIdToWorkItemId?.clear();

  for (const quests of perGuildQuests) {
    for (const quest of quests) {
      // Cover every status where work items can carry agentIds: seek_scope, seek_synth,
      // seek_walk (pathseeker-* roles get stamped during these) and in_progress
      // (downstream agents). A narrower filter would miss in-flight pathseekers and the
      // watcher would skip their JSONL.
      if (!isAnyAgentRunningQuestStatusGuard({ status: quest.status })) continue;
      seenQuestIds.add(quest.id);
      const set = new Set<AgentId>();
      for (const wi of quest.workItems) {
        if (isActiveWorkItemStatusGuard({ status: wi.status }) && wi.agentId !== undefined) {
          set.add(wi.agentId);
          agentIdToWorkItemId?.set(wi.agentId, wi.id);
        }
      }
      activeAgentIdsByQuest.set(quest.id, set);
    }
  }

  // Drop quests that no longer surface as active (deleted / abandoned / completed).
  const droppedQuestIds: QuestId[] = [];
  for (const questId of activeAgentIdsByQuest.keys()) {
    if (!seenQuestIds.has(questId)) {
      activeAgentIdsByQuest.delete(questId);
      droppedQuestIds.push(questId);
    }
  }

  return { droppedQuestIds };
};
