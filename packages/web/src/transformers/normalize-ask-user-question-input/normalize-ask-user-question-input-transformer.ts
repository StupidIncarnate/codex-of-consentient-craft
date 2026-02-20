/**
 * PURPOSE: Normalizes AskUserQuestion tool input by parsing a JSON-encoded `questions` string into an array
 *
 * USAGE:
 * normalizeAskUserQuestionInputTransformer({name: 'AskUserQuestion', input: {questions: '[{"question":"Pick one"}]'}});
 * // Returns {questions: [{question: "Pick one"}]} or the original input if normalization is not needed
 */

const ASK_USER_QUESTION_TOOL = 'AskUserQuestion';

export const normalizeAskUserQuestionInputTransformer = ({
  name,
  input,
}: {
  name: unknown;
  input: unknown;
}): unknown => {
  if (name !== ASK_USER_QUESTION_TOOL) {
    return input ?? {};
  }

  if (typeof input !== 'object' || input === null || !('questions' in input)) {
    return input ?? {};
  }

  const questions: unknown = Reflect.get(input, 'questions');

  if (typeof questions !== 'string') {
    return input;
  }

  try {
    const parsed: unknown = JSON.parse(questions);

    if (!Array.isArray(parsed)) {
      return input;
    }

    return { ...input, questions: parsed };
  } catch {
    return input;
  }
};
