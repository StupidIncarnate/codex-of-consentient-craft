/**
 * PURPOSE: Stops a running chat process for a session by posting to the stop endpoint
 *
 * USAGE:
 * await sessionChatStopBroker({sessionId, chatProcessId});
 * // Kills the running process on the server
 */
import type { ProcessId, SessionId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const sessionChatStopBroker = async ({
  sessionId,
  chatProcessId,
}: {
  sessionId: SessionId;
  chatProcessId: ProcessId;
}): Promise<void> => {
  const url = webConfigStatics.api.routes.sessionChatStop
    .replace(':sessionId', sessionId)
    .replace(':chatProcessId', chatProcessId);

  await fetchPostAdapter({ url, body: {} });
};
