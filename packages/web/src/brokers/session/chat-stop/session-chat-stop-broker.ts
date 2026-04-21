/**
 * PURPOSE: Stops a running chat process for a session by posting to the stop endpoint
 *
 * USAGE:
 * await sessionChatStopBroker({sessionId, chatProcessId});
 * // Kills the running process on the server
 */
import type { AdapterResult, ProcessId, SessionId } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const PLACEHOLDER_SESSION_ID = '_';

export const sessionChatStopBroker = async ({
  sessionId,
  chatProcessId,
}: {
  sessionId?: SessionId;
  chatProcessId: ProcessId;
}): Promise<AdapterResult> => {
  const url = webConfigStatics.api.routes.sessionChatStop
    .replace(':sessionId', sessionId ?? PLACEHOLDER_SESSION_ID)
    .replace(':chatProcessId', chatProcessId);

  await fetchPostAdapter({ url, body: {} });
  return adapterResultContract.parse({ success: true });
};
