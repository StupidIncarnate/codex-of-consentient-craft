import { z } from 'zod';

export const ruleViolationContract = z.object({
  node: z.unknown(),
  message: z.string().min(1).brand<'ViolationMessage'>(),
  messageId: z.string().brand<'MessageId'>().optional(),
  data: z.record(z.unknown()).optional(),
  fix: z.function().optional(),
  suggest: z
    .array(
      z.object({
        desc: z.string().min(1).brand<'SuggestionDescription'>(),
        fix: z.function(),
      }),
    )
    .optional(),
});

export type RuleViolation = z.infer<typeof ruleViolationContract>;
