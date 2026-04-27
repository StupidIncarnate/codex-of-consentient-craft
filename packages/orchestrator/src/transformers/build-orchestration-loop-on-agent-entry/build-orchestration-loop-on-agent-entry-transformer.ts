/**
 * PURPOSE: Builds the chat-output payload an orchestration-loop responder emits for an agent stream emission, memoizing per-slot sessionIds so the payload carries sessionId AND chatProcessId === sessionId on every emit once the slot's sessionId is learned
 *
 * USAGE:
 * const slotIndexToSessionId = new Map();
 * const payload = buildOrchestrationLoopOnAgentEntryTransformer({
 *   processId,
 *   slotIndexToSessionId,
 *   slotIndex,
 *   entries,
 *   sessionId,
 * });
 * orchestrationEventsState.emit({ type: 'chat-output', processId, payload });
 *
 * WHEN-TO-USE: Inside any responder that wires `questOrchestrationLoopBroker` to the
 * `orchestrationEventsState` chat-output bus. Centralizes payload-shaping and per-slot
 * sessionId memoization so every responder emits an identical wire shape.
 * WHEN-NOT-TO-USE: Bypass when emitting raw chat-output payloads that do NOT come from
 * the slot manager (e.g. chat-replay-responder, where chatProcessId is the replay key).
 */

import type { ChatEntry, ProcessId, SessionId } from '@dungeonmaster/shared/contracts';

import {
  chatOutputEmitPayloadContract,
  type ChatOutputEmitPayload,
} from '../../contracts/chat-output-emit-payload/chat-output-emit-payload-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';

export const buildOrchestrationLoopOnAgentEntryTransformer = ({
  processId,
  slotIndexToSessionId,
  slotIndex,
  entries,
  sessionId,
}: {
  processId: ProcessId;
  slotIndexToSessionId: Map<SlotIndex, SessionId>;
  slotIndex: SlotIndex;
  entries: ChatEntry[];
  sessionId?: SessionId;
}): ChatOutputEmitPayload => {
  if (sessionId !== undefined) {
    slotIndexToSessionId.set(slotIndex, sessionId);
  }
  const memoizedSessionId = slotIndexToSessionId.get(slotIndex);
  return chatOutputEmitPayloadContract.parse({
    processId,
    slotIndex,
    entries,
    ...(memoizedSessionId === undefined
      ? {}
      : { sessionId: memoizedSessionId, chatProcessId: memoizedSessionId }),
  });
};
