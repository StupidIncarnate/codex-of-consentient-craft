/**
 * PURPOSE: Zod schema for pre-edit lint configuration with rule list
 *
 * USAGE:
 * const config = preEditLintConfigContract.parse(configData);
 * // Returns validated PreEditLintConfig with rules array (strings or RuleConfig objects)
 */
import { z } from '#gateway/npm/zod';
import { ruleConfigContract } from '../rule-config/rule-config-contract';

export const preEditLintConfigContract = z.object({
  rules: z.array(z.union([z.string().min(1).brand<'PreEditLintConfigRules'>(), ruleConfigContract])),
}).brand<'PreEditLintConfig'>();

export type PreEditLintConfig = z.infer<typeof preEditLintConfigContract>;
