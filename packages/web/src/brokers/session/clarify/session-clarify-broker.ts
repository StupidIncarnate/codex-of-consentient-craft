/**
 * PURPOSE: Sends structured clarification answers to the server for design decision persistence and chat resumption
 *
 * USAGE:
 * const { chatProcessId } = await sessionClarifyBroker({ sessionId, guildId, questId, answers, questions });
 * // Returns { chatProcessId: ProcessId }
 */
import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import type { AskUserQuestionItem } from '../../../contracts/ask-user-question/ask-user-question-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const sessionClarifyBroker = async ({
  sessionId,
  guildId,
  questId,
  answers,
  questions,
}: {
  sessionId: SessionId;
  guildId: GuildId;
  questId: QuestId;
  answers: { header: string; label: string }[];
  questions: AskUserQuestionItem[];
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.sessionClarify.replace(':sessionId', sessionId);

  const response = await fetchPostAdapter<{ chatProcessId: unknown }>({
    url,
    body: { guildId, questId, answers, questions },
  });

  return { chatProcessId: processIdContract.parse(response.chatProcessId) };
};
