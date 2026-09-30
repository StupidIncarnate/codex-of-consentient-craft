/**
 * PURPOSE: Orchestrates clarification answer handling by persisting design decisions then resuming the chat session
 *
 * USAGE:
 * const { chatProcessId } = await ClarifyAnswerFlow({ guildId, sessionId, questId, answers, questions });
 * // Persists design decisions from structured answers, then resumes the agent via ChatStartResponder
 */

import type { ProcessId, SessionId, Quest, Guild } from '@dungeonmaster/shared/contracts';

import type { ClarificationQuestion } from '../../contracts/clarification-question/clarification-question-contract';
import { ClarifyAnswerResponder } from '../../responders/clarify/answer/clarify-answer-responder';
import { ChatStartResponder } from '../../responders/chat/start/chat-start-responder';

export const ClarifyAnswerFlow = async ({
  guildId,
  sessionId,
  questId,
  answers,
  questions,
}: {
  guildId: Guild['id'];
  sessionId: SessionId;
  questId: Quest['id'];
  answers: { header: string; label: string }[];
  questions: ClarificationQuestion[];
}): Promise<{ chatProcessId: ProcessId }> => {
  await ClarifyAnswerResponder({ questId, answers, questions });

  const message = answers.map((a) => `${a.header}: ${a.label}`).join('\n');

  return ChatStartResponder({ guildId, message, sessionId });
};
