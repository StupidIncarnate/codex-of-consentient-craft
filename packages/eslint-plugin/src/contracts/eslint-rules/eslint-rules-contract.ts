/**
 * PURPOSE: Validates ESLint rules configuration object with rule names mapped to severity levels or arrays
 *
 * USAGE:
 * const rules = eslintRulesContract.parse({ 'no-console': 'error', 'max-len': ['warn', 120] });
 * // Returns validated EslintRules record
 */
import { z } from '#gateway/npm/zod';
import { eslintRuleNameContract } from '../eslint-rule-name/eslint-rule-name-contract';

export const eslintRulesContract = z.record(
  eslintRuleNameContract,
  z.union([z.literal('off'), z.literal('warn'), z.literal('error'), z.array(z.unknown())]),
);

export type EslintRules = z.infer<typeof eslintRulesContract>;
