/**
 * PURPOSE: The package's own real `rules` object, imported directly (bypassing this subpath's own
 * barrel re-export) — for a caller staging a real ESLint `Rule.RuleModule` instead of hand-typing
 * one. The package's own `.d.ts` types every entry as `Rule.RuleModule` (real eslint's own type),
 * so no cast is needed to read its `meta`.
 *
 * USAGE:
 * const rules = RulesStub();
 * // Returns the real rules object the plugin ships, keyed by real rule name
 */
import { rules } from 'eslint-plugin-jest';
import type { Rule } from 'eslint';

export const RulesStub = (): Record<string, Rule.RuleModule> => rules;
