/**
 * PURPOSE: Zod schema for pre-edit lint configuration with rule list
 *
 * USAGE:
 * const config = preEditLintConfigContract.parse(configData);
 * // Returns validated PreEditLintConfig with rules array (strings or RuleConfig objects)
 */
import { z } from '#gateway/npm/zod';
import { ruleConfigContract } from '../rule-config/rule-config-contract';
import type { RuleConfig } from '../rule-config/rule-config-contract';

export const preEditLintConfigContract = z.object({
  rules: z.array(z.union([z.string().min(1).brand<'Rule'>(), ruleConfigContract])),
});

// `ruleConfigContract`'s own inferred type carries no `message` key at all — that field lives out
// of the schema entirely (see rule-config-contract.ts's header) — so a rules-array element read
// through the bare `z.infer` sees `message` only via `.loose()`'s catch-all index signature
// (`unknown`), not the hand-typed union `RuleConfig` declares. Substituting `RuleConfig` here is
// what lets a reader of `PreEditLintConfig['rules'][number]` see `message`'s real shape.
export type PreEditLintConfig = Omit<z.infer<typeof preEditLintConfigContract>, 'rules'> & {
  rules: (RuleConfig['rule'] | RuleConfig)[];
};
