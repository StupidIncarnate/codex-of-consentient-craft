/**
 * PURPOSE: Defines reusable callback types for orchestration event handlers (agent entries, session linking, followup creation)
 *
 * USAGE:
 * import type { OnAgentEntryCallback } from '../contracts/orchestration-callbacks/orchestration-callbacks-contract';
 * // Use as function parameter types in orchestration brokers
 */

import type { ChatEntry, SlotIndex, StreamSignalKind, WorkItem, Session } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../agent-role/agent-role-contract';

export type OnAgentEntryCallback = (params: {
  slotIndex: SlotIndex;
  entries: ChatEntry[];
  questWorkItemId: WorkItem['id'];
  sessionId?: Session['id'];
}) => void;

// Slot-manager-internal variant of OnAgentEntryCallback. The slot manager only knows its
// own internal `WorkItemId` (e.g. `work-item-0`, `followup-...`); each layer broker wraps
// this, translating slot-internal WorkItemId -> QuestWorkItemId via its slotToQuestMap
// before invoking the responder-facing OnAgentEntryCallback.
export type OnSlotAgentEntryCallback = (params: {
  slotIndex: SlotIndex;
  entries: ChatEntry[];
  workItemId: WorkItem['id'];
  sessionId?: Session['id'];
}) => void;

export type OnWorkItemSessionIdCallback = (params: {
  workItemId: WorkItem['id'];
  sessionId: Session['id'];
}) => void;

export type OnFollowupCreatedCallback = (params: {
  followupWorkItemId: WorkItem['id'];
  role: AgentRole;
  failedWorkItemId: WorkItem['id'];
}) => void;

export type OnWorkItemSummaryCallback = (params: {
  workItemId: WorkItem['id'];
  summary: string;
}) => void;

export type OnWorkItemSignalCallback = (params: {
  workItemId: WorkItem['id'];
  signal: StreamSignalKind;
}) => void;
