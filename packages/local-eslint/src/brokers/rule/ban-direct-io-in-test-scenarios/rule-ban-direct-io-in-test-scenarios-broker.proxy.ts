import { ruleBanDirectIoInTestScenariosBroker } from './rule-ban-direct-io-in-test-scenarios-broker';

export const ruleBanDirectIoInTestScenariosBrokerProxy = (): {
  callBroker: typeof ruleBanDirectIoInTestScenariosBroker;
} => ({
  callBroker: ruleBanDirectIoInTestScenariosBroker,
});
