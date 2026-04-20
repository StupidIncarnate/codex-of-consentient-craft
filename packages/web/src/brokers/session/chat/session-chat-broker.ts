/**
 * PURPOSE: Sends a chat message for a session or creates a new session via guild endpoint. If the quest is paused, resumes it first so the user's message lands in a live chat.
 *
 * USAGE:
 * const result = await sessionChatBroker({sessionId, guildId, message, questId, questStatus});
 * // Returns {chatProcessId: ProcessId}; auto-calls questResumeBroker first when questStatus === 'paused'.
 */
import { processIdContract } from '@dungeonmaster/shared/contracts';
import type {
  GuildId,
  ProcessId,
  QuestId,
  QuestStatus,
  SessionId,
  UserInput,
} from '@dungeonmaster/shared/contracts';
import { isUserPausedQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { questResumeBroker } from '../../quest/resume/quest-resume-broker';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const sessionChatBroker = async ({
  sessionId,
  guildId,
  message,
  questId,
  questStatus,
}: {
  sessionId?: SessionId;
  guildId: GuildId;
  message: UserInput;
  questId?: QuestId;
  questStatus?: QuestStatus;
}): Promise<{ chatProcessId: ProcessId }> => {
  if (
    questId !== undefined &&
    questStatus !== undefined &&
    isUserPausedQuestStatusGuard({ status: questStatus })
  ) {
    await questResumeBroker({ questId });
  }

  const url = sessionId
    ? webConfigStatics.api.routes.sessionChat.replace(':sessionId', sessionId)
    : webConfigStatics.api.routes.sessionNew;

  const body = { message, guildId };

  const response = await fetchPostAdapter<{ chatProcessId: unknown }>({
    url,
    body,
  });

  return { chatProcessId: processIdContract.parse(response.chatProcessId) };
};
