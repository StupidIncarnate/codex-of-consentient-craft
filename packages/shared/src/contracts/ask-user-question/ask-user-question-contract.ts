/**
 * PURPOSE: Defines the shape of an AskUserQuestion tool call's parsed input, containing questions with options
 *
 * USAGE:
 * askUserQuestionContract.parse({questions: [{question: 'Pick one', header: 'Choice', options: [{label: 'A', description: 'Option A'}], multiSelect: false}]});
 * // Returns validated AskUserQuestion object
 */

import { z } from '#gateway/npm/zod';

const askUserQuestionOptionContract = z.object({
  label: z.string().min(1).brand<'AskUserQuestionOptionLabel'>(),
  description: z.string().brand<'AskUserQuestionOptionDescription'>(),
}).brand<'AskUserQuestionOption'>();

export type AskUserQuestionOption = z.infer<typeof askUserQuestionOptionContract>;

const askUserQuestionItemContract = z.object({
  question: z.string().min(1).brand<'AskUserQuestionItemQuestion'>(),
  header: z.string().brand<'AskUserQuestionItemHeader'>(),
  options: z.array(askUserQuestionOptionContract),
  multiSelect: z.boolean(),
}).brand<'AskUserQuestionItem'>();

export type AskUserQuestionItem = z.infer<typeof askUserQuestionItemContract>;

export const askUserQuestionContract = z.object({
  questions: z.array(askUserQuestionItemContract).min(1),
}).brand<'AskUserQuestion'>();

export type AskUserQuestion = z.infer<typeof askUserQuestionContract>;
