/**
 * PURPOSE: Defines the input schema for the MCP ask-user-question tool
 *
 * USAGE:
 * askUserQuestionInputContract.parse({questions: [{question: 'Pick one', header: 'Choice', options: [{label: 'A', description: 'Option A'}], multiSelect: false}]});
 * // Returns validated ask-user-question input
 */
import { z } from 'zod';

export const askUserQuestionInputContract = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1).brand<'AskQuestionText'>(),
        header: z.string().brand<'AskQuestionHeader'>(),
        options: z.array(
          z.object({
            label: z.string().min(1).brand<'AskOptionLabel'>(),
            description: z.string().brand<'AskOptionDescription'>(),
          }),
        ),
        multiSelect: z.boolean(),
      }),
    )
    .min(1),
});

export type AskUserQuestionInput = z.infer<typeof askUserQuestionInputContract>;
