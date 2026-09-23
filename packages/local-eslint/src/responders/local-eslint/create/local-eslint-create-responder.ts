/**
 * PURPOSE: Assembles the local-eslint plugin object with repo-internal rules (ban-quest-status-literals, no-bare-location-literals, no-hardcoded-package-names, ban-locator-pick, ban-sync-seeding-methods, ban-direct-io-in-test-scenarios, graph-reachability, ban-bare-os-home-tmp).
 *
 * USAGE:
 * const plugin = LocalEslintCreateResponder();
 * // Returns { rules: { 'ban-quest-status-literals': EslintRule, 'no-bare-location-literals': EslintRule, 'no-hardcoded-package-names': EslintRule, 'ban-locator-pick': EslintRule, 'ban-sync-seeding-methods': EslintRule, 'ban-direct-io-in-test-scenarios': EslintRule, 'graph-reachability': EslintRule, 'ban-bare-os-home-tmp': EslintRule } }
 *
 * WHEN-TO-USE: Internal to the dungeonmaster monorepo only — this plugin is never published to npm.
 */
import type { EslintRule } from '@dungeonmaster/eslint-plugin';
import { ruleBanQuestStatusLiteralsBroker } from '../../../brokers/rule/ban-quest-status-literals/rule-ban-quest-status-literals-broker';
import { ruleNoBareLocationLiteralsBroker } from '../../../brokers/rule/no-bare-location-literals/rule-no-bare-location-literals-broker';
import { ruleNoHardcodedPackageNamesBroker } from '../../../brokers/rule/no-hardcoded-package-names/rule-no-hardcoded-package-names-broker';
import { ruleBanLocatorPickBroker } from '../../../brokers/rule/ban-locator-pick/rule-ban-locator-pick-broker';
import { ruleBanSyncSeedingMethodsBroker } from '../../../brokers/rule/ban-sync-seeding-methods/rule-ban-sync-seeding-methods-broker';
import { ruleBanDirectIoInTestScenariosBroker } from '../../../brokers/rule/ban-direct-io-in-test-scenarios/rule-ban-direct-io-in-test-scenarios-broker';
import { ruleGraphReachabilityBroker } from '../../../brokers/rule/graph-reachability/rule-graph-reachability-broker';
import { ruleBanBareOsHomeTmpBroker } from '../../../brokers/rule/ban-bare-os-home-tmp/rule-ban-bare-os-home-tmp-broker';

export const LocalEslintCreateResponder = (): {
  readonly rules: {
    readonly 'ban-quest-status-literals': EslintRule;
    readonly 'no-bare-location-literals': EslintRule;
    readonly 'no-hardcoded-package-names': EslintRule;
    readonly 'ban-locator-pick': EslintRule;
    readonly 'ban-sync-seeding-methods': EslintRule;
    readonly 'ban-direct-io-in-test-scenarios': EslintRule;
    readonly 'graph-reachability': EslintRule;
    readonly 'ban-bare-os-home-tmp': EslintRule;
  };
} =>
  ({
    rules: {
      'ban-quest-status-literals': ruleBanQuestStatusLiteralsBroker(),
      'no-bare-location-literals': ruleNoBareLocationLiteralsBroker(),
      'no-hardcoded-package-names': ruleNoHardcodedPackageNamesBroker(),
      'ban-locator-pick': ruleBanLocatorPickBroker(),
      'ban-sync-seeding-methods': ruleBanSyncSeedingMethodsBroker(),
      'ban-direct-io-in-test-scenarios': ruleBanDirectIoInTestScenariosBroker(),
      'graph-reachability': ruleGraphReachabilityBroker(),
      'ban-bare-os-home-tmp': ruleBanBareOsHomeTmpBroker(),
    },
  }) as const;
