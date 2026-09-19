import { ruleBanQuestStatusLiteralsBrokerProxy } from '../../../brokers/rule/ban-quest-status-literals/rule-ban-quest-status-literals-broker.proxy';
import { ruleNoBareLocationLiteralsBrokerProxy } from '../../../brokers/rule/no-bare-location-literals/rule-no-bare-location-literals-broker.proxy';
import { ruleNoHardcodedPackageNamesBrokerProxy } from '../../../brokers/rule/no-hardcoded-package-names/rule-no-hardcoded-package-names-broker.proxy';
import { ruleBanLocatorPickBrokerProxy } from '../../../brokers/rule/ban-locator-pick/rule-ban-locator-pick-broker.proxy';
import { ruleBanSyncSeedingMethodsBrokerProxy } from '../../../brokers/rule/ban-sync-seeding-methods/rule-ban-sync-seeding-methods-broker.proxy';
import { ruleBanDirectIoInTestScenariosBrokerProxy } from '../../../brokers/rule/ban-direct-io-in-test-scenarios/rule-ban-direct-io-in-test-scenarios-broker.proxy';
import { LocalEslintCreateResponder } from './local-eslint-create-responder';

export const LocalEslintCreateResponderProxy = (): {
  callResponder: typeof LocalEslintCreateResponder;
} => {
  ruleBanQuestStatusLiteralsBrokerProxy();
  ruleNoBareLocationLiteralsBrokerProxy();
  ruleNoHardcodedPackageNamesBrokerProxy();
  ruleBanLocatorPickBrokerProxy();
  ruleBanSyncSeedingMethodsBrokerProxy();
  ruleBanDirectIoInTestScenariosBrokerProxy();

  return {
    callResponder: LocalEslintCreateResponder,
  };
};
