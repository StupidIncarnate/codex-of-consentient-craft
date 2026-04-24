import { toolingRunSmoketestBrokerProxy } from '../../brokers/tooling/run-smoketest/tooling-run-smoketest-broker.proxy';

export const useSmoketestRunBindingProxy = (): ReturnType<typeof toolingRunSmoketestBrokerProxy> =>
  toolingRunSmoketestBrokerProxy();
