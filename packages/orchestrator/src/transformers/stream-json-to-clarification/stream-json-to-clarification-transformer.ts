/**
 * PURPOSE: Extracts ask-user-question clarification payload from a parsed ChatEntry
 *
 * USAGE:
 * streamJsonToClarificationTransformer({ entry: AssistantToolUseChatEntryStub({ toolName: 'mcp__dungeonmaster__ask-user-question', toolInput: '{"questions":[...]}' }) });
 * // Returns { questions: ClarificationQuestion[] } if the entry is an ask-user-question tool_use, null otherwise
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import {
  clarificationQuestionContract,
  type ClarificationQuestion,
} from '../../contracts/clarification-question/clarification-question-contract';

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
    if (typeof parsedInput !== 'object' || parsedInput === null || !('questions' in parsedInput)) {
      return null;
    }

    const questionsRaw: unknown = Reflect.get(parsedInput, 'questions');
    if (!Array.isArray(questionsRaw)) {
      return null;
    }

    const questions: ClarificationQuestion[] = [];
    for (const q of questionsRaw) {
      const parseResult = clarificationQuestionContract.safeParse(q);
      if (!parseResult.success) {
        return null;
      }
      questions.push(parseResult.data);
    }

    if (questions.length === 0) {
      return null;
    }

    return { questions };
  } catch {
    return null;
  }
};
