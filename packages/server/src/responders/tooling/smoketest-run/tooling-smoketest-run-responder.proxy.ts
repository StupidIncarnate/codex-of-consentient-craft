import { configRootFindBrokerProxy } from '@dungeonmaster/shared/testing';

import { orchestratorRunSmoketestAdapterProxy } from '../../../adapters/orchestrator/run-smoketest/orchestrator-run-smoketest-adapter.proxy';

export const ToolingSmoketestRunResponderProxy = (): Record<PropertyKey, never> => {
  orchestratorRunSmoketestAdapterProxy();
  configRootFindBrokerProxy();
  return {};
};
