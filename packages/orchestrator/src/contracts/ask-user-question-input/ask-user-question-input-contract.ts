/**
 * PURPOSE: Defines the shape of the ask-user-question MCP tool input parsed from a tool_use entry
 *
 * USAGE:
 * askUserQuestionInputContract.parse({ questions: [{question: 'Pick one', header: 'Choice', options: [{label: 'A', description: 'Option A'}], multiSelect: false}] });
 * // Returns validated AskUserQuestionInput
 */

import { z } from 'zod';

import { clarificationQuestionContract } from '../clarification-question/clarification-question-contract';

export const askUserQuestionInputContract = z.object({
  questions: z.array(clarificationQuestionContract),
});

export type AskUserQuestionInput = z.infer<typeof askUserQuestionInputContract>;
