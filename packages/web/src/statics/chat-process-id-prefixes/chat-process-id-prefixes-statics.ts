/**
 * PURPOSE: Defines the set of well-known orchestration-process-id prefixes the web client recognizes when filtering chat-output WS messages
 *
 * USAGE:
 * chatProcessIdPrefixesStatics.nonSessionPrefixes;
 * // Returns the readonly tuple of prefixes that mark a chatProcessId as NOT being a bare sessionId
 */

export const chatProcessIdPrefixesStatics = {
  // chatProcessId values starting with one of these prefixes are NOT bare sessionIds —
  // they identify an orchestration process (queue runner, recovery loop, chat spawn,
  // design spawn, replay request) and must NOT be treated as a per-session bucket key.
  // Live codeweaver chat-output emits stamp `chatProcessId = sessionId` (a bare UUID),
  // which is the case the bare-uuid guard recognizes.
  nonSessionPrefixes: ['exec-replay-', 'replay-', 'chat-', 'design-', 'proc-'] as const,
} as const;
