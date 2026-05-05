/**
 * PURPOSE: Defines the input schema for the MCP ask-user-question tool
 *
 * USAGE:
 * askUserQuestionInputContract.parse({questions: [{question: 'Pick one', header: 'Choice', options: [{label: 'A', description: 'Option A'}], multiSelect: false}]});
 * // Returns validated ask-user-question input
 */
import { z } from 'zod';

import { coercedBooleanInputContract } from '../coerced-boolean-input/coerced-boolean-input-contract';

export const askUserQuestionInputContract = z
  .object({
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
          multiSelect: coercedBooleanInputContract,
        }),
      )
      .min(1),
  })
  .strict();

export type AskUserQuestionInput = z.infer<typeof askUserQuestionInputContract>;
