/**
 * PURPOSE: Extracts ask-user-question tool calls from a Claude stream-json output line
 *
 * USAGE:
 * streamJsonToClarificationTransformer({ line: StreamJsonLineStub({ value: '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"mcp__dungeonmaster__ask-user-question","input":{"questions":[...]}}]}}' }) });
 * // Returns { questions: ClarificationQuestion[] } if ask-user-question tool found, null otherwise
 */

import {
  clarificationQuestionContract,
  type ClarificationQuestion,
} from '../../contracts/clarification-question/clarification-question-contract';
import type { StreamJsonLine } from '../../contracts/stream-json-line/stream-json-line-contract';

export const streamJsonToClarificationTransformer = ({
  line,
}: {
  line: StreamJsonLine;
}): { questions: ClarificationQuestion[] } | null => {
  try {
    const parsed: unknown = JSON.parse(line);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('type' in parsed) ||
      Reflect.get(parsed, 'type') !== 'assistant'
    ) {
      return null;
    }

    const message: unknown = Reflect.get(parsed, 'message');
    if (typeof message !== 'object' || message === null || !('content' in message)) {
      return null;
    }

    const content: unknown = Reflect.get(message, 'content');
    if (!Array.isArray(content)) {
      return null;
    }

    for (const item of content) {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('type' in item) ||
        Reflect.get(item, 'type') !== 'tool_use' ||
        !('name' in item) ||
        Reflect.get(item, 'name') !== 'mcp__dungeonmaster__ask-user-question'
      ) {
        continue;
      }

      if (!('input' in item)) {
        return null;
      }

      const input: unknown = Reflect.get(item, 'input');
      if (typeof input !== 'object' || input === null || !('questions' in input)) {
        return null;
      }

      const questionsRaw: unknown = Reflect.get(input, 'questions');
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
    }

    return null;
  } catch {
    return null;
  }
};
