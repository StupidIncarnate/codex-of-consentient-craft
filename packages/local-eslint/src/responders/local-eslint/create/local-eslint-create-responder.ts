/**
 * PURPOSE: Assembles the local-eslint plugin object with repo-internal rules (ban-quest-status-literals, no-bare-location-literals, no-hardcoded-package-names, ban-locator-pick, ban-sync-seeding-methods, ban-direct-io-in-test-scenarios, graph-reachability, ban-self-located-repo-lookup).
 *
 * USAGE:
 * const plugin = LocalEslintCreateResponder();
 * // Returns { rules: { 'ban-quest-status-literals': RuleModule, 'no-bare-location-literals': RuleModule, 'no-hardcoded-package-names': RuleModule, 'ban-locator-pick': RuleModule, 'ban-sync-seeding-methods': RuleModule, 'ban-direct-io-in-test-scenarios': RuleModule, 'graph-reachability': RuleModule, 'ban-self-located-repo-lookup': RuleModule } }
 *
 * WHEN-TO-USE: Internal to the dungeonmaster monorepo only — this plugin is never published to npm.
 */
import { ruleBanQuestStatusLiteralsBroker } from '../../../brokers/rule/ban-quest-status-literals/rule-ban-quest-status-literals-broker';
import { ruleNoBareLocationLiteralsBroker } from '../../../brokers/rule/no-bare-location-literals/rule-no-bare-location-literals-broker';
import { ruleNoHardcodedPackageNamesBroker } from '../../../brokers/rule/no-hardcoded-package-names/rule-no-hardcoded-package-names-broker';
import { ruleBanLocatorPickBroker } from '../../../brokers/rule/ban-locator-pick/rule-ban-locator-pick-broker';
import { ruleBanSyncSeedingMethodsBroker } from '../../../brokers/rule/ban-sync-seeding-methods/rule-ban-sync-seeding-methods-broker';
import { ruleBanDirectIoInTestScenariosBroker } from '../../../brokers/rule/ban-direct-io-in-test-scenarios/rule-ban-direct-io-in-test-scenarios-broker';
import { ruleBanSelfLocatedRepoLookupBroker } from '../../../brokers/rule/ban-self-located-repo-lookup/rule-ban-self-located-repo-lookup-broker';
import { ruleGraphReachabilityBroker } from '../../../brokers/rule/graph-reachability/rule-graph-reachability-broker';

export const LocalEslintCreateResponder = (): {
  readonly rules: {
    readonly 'ban-quest-status-literals': ReturnType<typeof ruleBanQuestStatusLiteralsBroker>;
    readonly 'no-bare-location-literals': ReturnType<typeof ruleNoBareLocationLiteralsBroker>;
    readonly 'no-hardcoded-package-names': ReturnType<typeof ruleNoHardcodedPackageNamesBroker>;
    readonly 'ban-locator-pick': ReturnType<typeof ruleBanLocatorPickBroker>;
    readonly 'ban-sync-seeding-methods': ReturnType<typeof ruleBanSyncSeedingMethodsBroker>;
    readonly 'ban-direct-io-in-test-scenarios': ReturnType<
      typeof ruleBanDirectIoInTestScenariosBroker
    >;
    readonly 'graph-reachability': ReturnType<typeof ruleGraphReachabilityBroker>;
    readonly 'ban-self-located-repo-lookup': ReturnType<typeof ruleBanSelfLocatedRepoLookupBroker>;
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
      'ban-self-located-repo-lookup': ruleBanSelfLocatedRepoLookupBroker(),
    },
  }) as const;
