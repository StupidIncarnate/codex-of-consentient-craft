import { architectureOverviewBrokerProxy } from '@dungeonmaster/shared/testing';

export const HookSubagentStartResponderProxy = (): Record<PropertyKey, never> => {
  architectureOverviewBrokerProxy();

  return {};
};
