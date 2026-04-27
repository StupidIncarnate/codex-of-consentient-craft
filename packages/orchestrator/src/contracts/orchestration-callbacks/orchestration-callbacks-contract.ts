/**
 * PURPOSE: Defines reusable callback types for orchestration event handlers (agent entries, session linking, followup creation)
 *
 * USAGE:
 * import type { OnAgentEntryCallback } from '../contracts/orchestration-callbacks/orchestration-callbacks-contract';
 * // Use as function parameter types in orchestration brokers
 */

import { z } from 'zod';
import {
  questWorkItemIdContract,
  sessionIdContract,
  streamSignalKindContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestWorkItemId, SessionId, StreamSignalKind } from '@dungeonmaster/shared/contracts';

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
    questWorkItemId: questWorkItemIdContract,
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
  onWorkItemSignalParams: z.object({
    workItemId: workItemIdContract,
    signal: streamSignalKindContract,
  }),
});

export type OnAgentEntryCallback = (params: {
  slotIndex: SlotIndex;
  entry: Record<string, unknown>;
  questWorkItemId: QuestWorkItemId;
  sessionId?: SessionId;
}) => void;

// Slot-manager-internal variant of OnAgentEntryCallback. The slot manager only knows its
// own internal `WorkItemId` (e.g. `work-item-0`, `followup-...`); each layer broker wraps
// this, translating slot-internal WorkItemId -> QuestWorkItemId via its slotToQuestMap
// before invoking the responder-facing OnAgentEntryCallback.
export type OnSlotAgentEntryCallback = (params: {
  slotIndex: SlotIndex;
  entry: Record<string, unknown>;
  workItemId: WorkItemId;
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

export type OnWorkItemSignalCallback = (params: {
  workItemId: WorkItemId;
  signal: StreamSignalKind;
}) => void;
