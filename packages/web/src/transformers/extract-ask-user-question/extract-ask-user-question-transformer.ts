/**
 * PURPOSE: Extracts and parses the AskUserQuestion tool input from a list of chat entries
 *
 * USAGE:
 * extractAskUserQuestionTransformer({entries});
 * // Returns parsed {questions: [...]} object or null if no AskUserQuestion found
 */

import { askUserQuestionContract } from '@dungeonmaster/shared/contracts';
import type { AskUserQuestion } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';

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
