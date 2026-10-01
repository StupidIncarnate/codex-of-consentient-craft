/**
 * PURPOSE: Orchestrates clarification answer handling by persisting design decisions then resuming the chat session
 *
 * USAGE:
 * const { chatProcessId } = await ClarifyAnswerFlow({ guildId, sessionId, questId, answers, questions });
 * // Persists design decisions from structured answers, then resumes the agent via ChatStartResponder
 */

import { clarifyAnswerResultContract } from '../../contracts/clarify-answer-result/clarify-answer-result-contract';
import type { ClarifyAnswerResult } from '../../contracts/clarify-answer-result/clarify-answer-result-contract';
import type { Quest, Guild, Session } from '@dungeonmaster/shared/contracts';

import type { ClarificationAnswer } from '../../contracts/clarification-answer/clarification-answer-contract';
import type { ClarificationQuestion } from '../../contracts/clarification-question/clarification-question-contract';
import { clarificationAnswerToLineTransformer } from '../../transformers/clarification-answer-to-line/clarification-answer-to-line-transformer';
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
  sessionId: Session['id'];
  questId: Quest['id'];
  answers: ClarificationAnswer[];
  questions: ClarificationQuestion[];
}): Promise<ClarifyAnswerResult> => {
  await ClarifyAnswerResponder({ questId, answers, questions });

  const message = answers
    .map((answer) => clarificationAnswerToLineTransformer({ answer }))
    .join('\n');

  return clarifyAnswerResultContract.parse(
    await ChatStartResponder({ guildId, message, sessionId }),
  );
};
