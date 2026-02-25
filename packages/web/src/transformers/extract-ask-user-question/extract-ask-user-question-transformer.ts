/**
 * PURPOSE: Extracts and parses the AskUserQuestion tool input from a list of chat entries
 *
 * USAGE:
 * extractAskUserQuestionTransformer({entries});
 * // Returns parsed {questions: [...]} object or null if no AskUserQuestion found
 */

import { askUserQuestionContract } from '../../contracts/ask-user-question/ask-user-question-contract';
import type { AskUserQuestion } from '../../contracts/ask-user-question/ask-user-question-contract';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';

const ASK_USER_QUESTION_TOOL = 'mcp__dungeonmaster__ask-user-question';

export const extractAskUserQuestionTransformer = ({
  entries,
}: {
  entries: ChatEntry[];
}): AskUserQuestion | null => {
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];

    if (!entry) continue;

    if (
      entry.role === 'assistant' &&
      entry.type === 'tool_use' &&
      entry.toolName === ASK_USER_QUESTION_TOOL
    ) {
      const parsed: unknown = JSON.parse(entry.toolInput);

      const result = askUserQuestionContract.safeParse(parsed);

      return result.success ? result.data : null;
    }
  }

  return null;
};
