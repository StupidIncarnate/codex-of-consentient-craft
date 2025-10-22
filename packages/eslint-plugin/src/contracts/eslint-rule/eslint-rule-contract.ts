import { z } from 'zod';
import type { EslintContext } from '../eslint-context/eslint-context-contract';

/**
 * ESLint Rule contract - translates eslint package Rule types to branded Zod schemas.
 * Contract defines ONLY data properties (no z.function()).
 * Type intersection adds function properties.
 */

export const eslintRuleContract = z.object({
  meta: z.object({
    type: z.enum(['problem', 'suggestion', 'layout']).brand<'EslintRuleType'>(),
    docs: z.object({
      description: z.string().min(1).brand<'RuleDescription'>(),
      category: z.string().brand<'RuleCategory'>().optional(),
      recommended: z.boolean().optional(),
    }),
    fixable: z.enum(['code', 'whitespace']).optional(),
    schema: z.array(z.unknown()).optional(),
    messages: z
      .record(z.string().brand<'MessageId'>(), z.string().brand<'RuleMessage'>())
      .optional(),
  }),
});

// Type intersection adds function properties
export type EslintRule = z.infer<typeof eslintRuleContract> & {
  create: (
    context: EslintContext,
  ) => Record<string & z.BRAND<'EslintSelector'>, (node: unknown) => void>;
};
