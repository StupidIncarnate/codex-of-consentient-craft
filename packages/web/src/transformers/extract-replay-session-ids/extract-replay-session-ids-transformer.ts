/**
 * PURPOSE: Extracts the sessionId from each replay-history WebSocket message in a captured outbound list, ignoring any other message shapes
 *
 * USAGE:
 * extractReplaySessionIdsTransformer({ messages: sentWsMessages });
 * // Returns SessionId[] for the replay-history messages, in order
 */

import type { Session } from '@dungeonmaster/shared/contracts';

import { replayHistoryMessageContract } from '../../contracts/replay-history-message/replay-history-message-contract';

export const extractReplaySessionIdsTransformer = ({
  messages,
}: {
  messages: readonly unknown[];
}): Session['id'][] =>
  messages.flatMap((msg) => {
    const parsed = replayHistoryMessageContract.safeParse(msg);
    return parsed.success ? [parsed.data.sessionId] : [];
  });
