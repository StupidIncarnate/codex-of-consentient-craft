/**
 * PURPOSE: Assembles the local-eslint plugin object with repo-internal rules (ban-quest-status-literals, no-bare-location-literals, no-hardcoded-package-names).
 *
 * USAGE:
 * const plugin = LocalEslintCreateResponder();
 * // Returns { rules: { 'ban-quest-status-literals': EslintRule, 'no-bare-location-literals': EslintRule, 'no-hardcoded-package-names': EslintRule } }
 *
 * WHEN-TO-USE: Internal to the dungeonmaster monorepo only — this plugin is never published to npm.
 */
import type { EslintRule } from '@dungeonmaster/eslint-plugin';
import { ruleBanQuestStatusLiteralsBroker } from '../../../brokers/rule/ban-quest-status-literals/rule-ban-quest-status-literals-broker';
import { ruleNoBareLocationLiteralsBroker } from '../../../brokers/rule/no-bare-location-literals/rule-no-bare-location-literals-broker';
import { ruleNoHardcodedPackageNamesBroker } from '../../../brokers/rule/no-hardcoded-package-names/rule-no-hardcoded-package-names-broker';

export const LocalEslintCreateResponder = (): {
  readonly rules: {
    readonly 'ban-quest-status-literals': EslintRule;
    readonly 'no-bare-location-literals': EslintRule;
    readonly 'no-hardcoded-package-names': EslintRule;
  };
} =>
  ({
    rules: {
      'ban-quest-status-literals': ruleBanQuestStatusLiteralsBroker(),
      'no-bare-location-literals': ruleNoBareLocationLiteralsBroker(),
      'no-hardcoded-package-names': ruleNoHardcodedPackageNamesBroker(),
    },
  }) as const;
