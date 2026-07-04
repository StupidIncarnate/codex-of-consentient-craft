/**
 * PURPOSE: Decides whether the Node dispatcher may start playing — refuses while a
 * /dumpster-launch loop still owns the queue. Two signals: (a) a fresh MCP get-next-step
 * heartbeat in dispatch-state.json, and (b) any in-flight Task-dispatched agent (an
 * `in_progress` work item with `agentId` stamped — only the MCP identity resolution ever sets
 * agentId, so this covers the long Task-await gap where the launch loop isn't polling).
 * `force` skips both checks for a crashed/stuck launch loop.
 *
 * USAGE:
 * const gate = await dispatchStatePlayGateBroker({});
 * // Returns { allowed: true } or { allowed: false, reason: '...' }
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isActivelyExecutingQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import type { DispatchPlayGateResult } from '../../../contracts/dispatch-play-gate-result/dispatch-play-gate-result-contract';
import { dispatchPlayGateResultContract } from '../../../contracts/dispatch-play-gate-result/dispatch-play-gate-result-contract';
import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../../quest/list/quest-list-broker';
import { dispatchStateReadBroker } from '../read/dispatch-state-read-broker';

export const dispatchStatePlayGateBroker = async ({
  force,
}: {
  force?: boolean;
}): Promise<DispatchPlayGateResult> => {
  if (force === true) {
    return dispatchPlayGateResultContract.parse({ allowed: true });
  }

  const state = await dispatchStateReadBroker();
  if (state.mcpHeartbeatAt !== undefined) {
    const heartbeatAgeMs = Date.now() - new Date(state.mcpHeartbeatAt).getTime();
    if (heartbeatAgeMs < orchestrationDispatchStatics.mcpHeartbeatTtlMs) {
      return dispatchPlayGateResultContract.parse({
        allowed: false,
        reason: orchestrationDispatchStatics.exclusivity.heartbeatRefusalReason,
      });
    }
  }

  const guilds = await guildListBroker();
  const perGuildQuests = await Promise.all(
    guilds
      .filter((guild) => guild.valid)
      .map(async (guild) => {
        try {
          const quests = await questListBroker({ guildId: guild.id });
          return quests.filter((quest) =>
            isActivelyExecutingQuestStatusGuard({ status: quest.status }),
          );
        } catch {
          // One broken guild must not block the gate decision for the rest.
          return [] as Quest[];
        }
      }),
  );
  const hasInFlightMcpAgent = perGuildQuests
    .flat()
    .some((quest) =>
      quest.workItems.some(
        (workItem) =>
          isActiveWorkItemStatusGuard({ status: workItem.status }) &&
          workItem.agentId !== undefined,
      ),
    );
  if (hasInFlightMcpAgent) {
    return dispatchPlayGateResultContract.parse({
      allowed: false,
      reason: orchestrationDispatchStatics.exclusivity.inFlightRefusalReason,
    });
  }

  return dispatchPlayGateResultContract.parse({ allowed: true });
};
