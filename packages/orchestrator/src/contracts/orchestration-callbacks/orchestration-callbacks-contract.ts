/**
 * PURPOSE: Defines reusable callback types for orchestration event handlers (agent entries, session linking, followup creation)
 *
 * USAGE:
 * import type { OnAgentEntryCallback } from '../contracts/orchestration-callbacks/orchestration-callbacks-contract';
 * // Use as function parameter types in orchestration brokers
 */

import { z } from 'zod';
import { sessionIdContract } from '@dungeonmaster/shared/contracts';
import type { SessionId } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../agent-role/agent-role-contract';
import { agentRoleContract } from '../agent-role/agent-role-contract';
import { slotIndexContract } from '../slot-index/slot-index-contract';
import type { SlotIndex } from '../slot-index/slot-index-contract';
import { workItemIdContract } from '../work-item-id/work-item-id-contract';
import type { WorkItemId } from '../work-item-id/work-item-id-contract';

export const orchestrationCallbacksContract = z.object({
  onAgentEntryParams: z.object({
    slotIndex: slotIndexContract,
    entry: z.record(z.unknown()),
    sessionId: sessionIdContract.optional(),
  }),
  onWorkItemSessionIdParams: z.object({
    workItemId: workItemIdContract,
    sessionId: sessionIdContract,
  }),
  onFollowupCreatedParams: z.object({
    followupWorkItemId: workItemIdContract,
    role: agentRoleContract,
    failedWorkItemId: workItemIdContract,
  }),
  onWorkItemSummaryParams: z.object({
    workItemId: workItemIdContract,
    summary: z.string().brand<'SignalSummary'>(),
  }),
});

export type OnAgentEntryCallback = (params: {
  slotIndex: SlotIndex;
  entry: Record<string, unknown>;
  sessionId?: SessionId;
}) => void;

export type OnWorkItemSessionIdCallback = (params: {
  workItemId: WorkItemId;
  sessionId: SessionId;
}) => void;

export type OnFollowupCreatedCallback = (params: {
  followupWorkItemId: WorkItemId;
  role: AgentRole;
  failedWorkItemId: WorkItemId;
}) => void;

export type OnWorkItemSummaryCallback = (params: {
  workItemId: WorkItemId;
  summary: string;
}) => void;
