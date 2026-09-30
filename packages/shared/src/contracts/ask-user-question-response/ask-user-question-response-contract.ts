/**
 * PURPOSE: Defines the shape of an AskUserQuestion tool's PostToolUse payload — the input questions plus an answers map keyed by question text. Claude Code emits this in both tool_input and tool_response on the AskUserQuestion hook event.
 *
 * USAGE:
 * askUserQuestionResponseContract.parse({
 *   questions: [{question: 'Pick one', header: 'Choice', options: [{label: 'A', description: 'Option A'}], multiSelect: false}],
 *   answers: {'Pick one': 'A'},
 * });
 * // Returns validated AskUserQuestionResponse with branded answer values
 */

import { z } from '#gateway/npm/zod';

import { askUserQuestionContract } from '../ask-user-question/ask-user-question-contract';

const answerValueContract = z.union([
  z.string().brand<'AnswerValue'>(),
  z.array(z.string().brand<'AnswerValue'>()),
]);

export const askUserQuestionResponseContract = askUserQuestionContract.extend({
  answers: z.record(
    askUserQuestionContract.shape.questions.element.shape.question,
    answerValueContract,
  ),
}).brand<'AskUserQuestionResponse'>();

export type AskUserQuestionResponse = z.infer<typeof askUserQuestionResponseContract>;
export type AnswerValue = z.infer<typeof answerValueContract>;
