/**
 * PURPOSE: Extracts ask-user-question clarification payload from a parsed ChatEntry
 *
 * USAGE:
 * streamJsonToClarificationTransformer({ entry: AssistantToolUseChatEntryStub({ toolName: 'mcp__dungeonmaster__ask-user-question', toolInput: '{"questions":[...]}' }) });
 * // Returns { questions: ClarificationQuestion[] } if the entry is an ask-user-question tool_use, null otherwise
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { askUserQuestionInputContract } from '../../contracts/ask-user-question-input/ask-user-question-input-contract';
import type { ClarificationQuestion } from '../../contracts/clarification-question/clarification-question-contract';

const ASK_USER_QUESTION_TOOL = 'mcp__dungeonmaster__ask-user-question';

export const streamJsonToClarificationTransformer = ({
  entry,
}: {
  entry: ChatEntry;
}): { questions: ClarificationQuestion[] } | null => {
  if (entry.role !== 'assistant' || entry.type !== 'tool_use') {
    return null;
  }

  if (entry.toolName !== ASK_USER_QUESTION_TOOL) {
    return null;
  }

  try {
    const parsedInput: unknown = JSON.parse(entry.toolInput);
    const questionsParseResult = askUserQuestionInputContract.safeParse(parsedInput);
    if (!questionsParseResult.success) {
      return null;
    }

    const { questions } = questionsParseResult.data;

    if (questions.length === 0) {
      return null;
    }

    return { questions };
  } catch {
    return null;
  }
};
