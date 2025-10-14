import { z } from 'zod';

export const eslintRuleContract = z.object({
  meta: z.object({
    type: z.enum(['problem', 'suggestion', 'layout']),
    docs: z.object({
      description: z.string().min(1).brand<'RuleDescription'>(),
      category: z.string().brand<'RuleCategory'>().optional(),
      recommended: z.boolean().optional(),
    }),
    fixable: z.enum(['code', 'whitespace']).optional(),
    schema: z.array(z.unknown()).optional(),
    messages: z.record(z.string().brand<'RuleMessage'>()).optional(),
  }),
  create: z.function(),
});

export type EslintRule = z.infer<typeof eslintRuleContract>;
