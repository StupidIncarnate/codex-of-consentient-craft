/**
 * PURPOSE: Assembles the local-eslint plugin object with repo-internal rules (ban-quest-status-literals).
 *
 * USAGE:
 * const plugin = LocalEslintCreateResponder();
 * // Returns { rules: { 'ban-quest-status-literals': EslintRule } }
 *
 * WHEN-TO-USE: Internal to the dungeonmaster monorepo only — this plugin is never published to npm.
 */
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { ruleBanQuestStatusLiteralsBroker } from '../../../brokers/rule/ban-quest-status-literals/rule-ban-quest-status-literals-broker';

export const LocalEslintCreateResponder = (): {
  readonly rules: {
    readonly 'ban-quest-status-literals': EslintRule;
  };
} =>
  ({
    rules: {
      'ban-quest-status-literals': ruleBanQuestStatusLiteralsBroker(),
    },
  }) as const;
