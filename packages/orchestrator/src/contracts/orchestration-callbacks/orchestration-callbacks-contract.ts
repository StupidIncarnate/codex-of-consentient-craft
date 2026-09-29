/**
 * PURPOSE: Defines reusable callback types for orchestration event handlers (agent entries, session linking, followup creation)
 *
 * USAGE:
 * import type { OnAgentEntryCallback } from '../contracts/orchestration-callbacks/orchestration-callbacks-contract';
 * // Use as function parameter types in orchestration brokers
 */

import type {
  ChatEntry,
  QuestWorkItemId,
  SessionId,
  SlotIndex,
  StreamSignalKind,
} from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../agent-role/agent-role-contract';
import type { WorkItemId } from '../work-item-id/work-item-id-contract';

export type OnAgentEntryCallback = (params: {
  slotIndex: SlotIndex;
  entries: ChatEntry[];
  questWorkItemId: QuestWorkItemId;
  sessionId?: SessionId;
}) => void;

// Slot-manager-internal variant of OnAgentEntryCallback. The slot manager only knows its
// own internal `WorkItemId` (e.g. `work-item-0`, `followup-...`); each layer broker wraps
// this, translating slot-internal WorkItemId -> QuestWorkItemId via its slotToQuestMap
// before invoking the responder-facing OnAgentEntryCallback.
export type OnSlotAgentEntryCallback = (params: {
  slotIndex: SlotIndex;
  entries: ChatEntry[];
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
