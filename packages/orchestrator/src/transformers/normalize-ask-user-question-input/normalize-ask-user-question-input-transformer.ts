/**
 * PURPOSE: Normalizes AskUserQuestion tool input by parsing a JSON-encoded `questions` string into an array
 *
 * USAGE:
 * normalizeAskUserQuestionInputTransformer({name: 'AskUserQuestion', input: {questions: '[{"question":"Pick one"}]'}});
 * // Returns {questions: [{question: "Pick one"}]} or the original input if normalization is not needed
 */

import {
  askUserQuestionToolInputContract,
  type AskUserQuestionToolInput,
} from '../../contracts/ask-user-question-tool-input/ask-user-question-tool-input-contract';

const ASK_USER_QUESTION_TOOL = 'mcp__dungeonmaster__ask-user-question';

export const normalizeAskUserQuestionInputTransformer = ({
  name,
  input,
}: {
  name: unknown;
  input: unknown;
}): AskUserQuestionToolInput => {
  const inputParse = askUserQuestionToolInputContract.safeParse(input ?? {});

  if (name !== ASK_USER_QUESTION_TOOL) {
    return inputParse.success ? inputParse.data : {};
  }

  if (!inputParse.success) {
    return {};
  }

  const { questions } = inputParse.data;
  if (typeof questions !== 'string') {
    return inputParse.data;
  }

  try {
    const parsed: unknown = JSON.parse(String(questions));

    if (!Array.isArray(parsed)) {
      return inputParse.data;
    }

    return { ...inputParse.data, questions: parsed };
  } catch {
    return inputParse.data;
  }
};
