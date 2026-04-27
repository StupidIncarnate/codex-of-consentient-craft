/**
 * PURPOSE: Checks if a chat-output payload's chatProcessId is a bare UUID — i.e. a sessionId stamped onto chatProcessId by the orchestrator's live emit path, with no known orchestration prefix in front of it
 *
 * USAGE:
 * isBareUuidChatProcessIdGuard({ chatProcessId: '619e2258-918c-4408-aeb1-f8f4ce8400cb' });
 * // Returns true — bare UUID, treat as sessionId
 * isBareUuidChatProcessIdGuard({ chatProcessId: 'exec-replay-619e2258-918c-4408-aeb1-f8f4ce8400cb' });
 * // Returns false — has the exec-replay- prefix, handled by the explicit replay branch instead
 *
 * WHEN-TO-USE: In the QuestChatWidget chat-output WS handler as a defensive fallback when payload.sessionId is absent. If the orchestrator stamps chatProcessId = sessionId on live emits and the explicit sessionId field somehow gets dropped, this guard recovers routing.
 * WHEN-NOT-TO-USE: Do not use to validate sessionId-typed values — the existing exec-replay- prefix slice already handles the replay path explicitly.
 */

import { chatProcessIdPrefixesStatics } from '../../statics/chat-process-id-prefixes/chat-process-id-prefixes-statics';

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

export const isBareUuidChatProcessIdGuard = ({
  chatProcessId,
}: {
  chatProcessId?: string;
}): boolean => {
  if (chatProcessId === undefined) return false;
  for (const prefix of chatProcessIdPrefixesStatics.nonSessionPrefixes) {
    if (chatProcessId.startsWith(prefix)) return false;
  }
  return UUID_SHAPE.test(chatProcessId);
};
