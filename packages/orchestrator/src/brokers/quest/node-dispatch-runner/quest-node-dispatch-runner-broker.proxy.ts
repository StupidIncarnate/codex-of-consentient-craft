import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

// The controller runs over injected deps; its only outside call is the kick-failure line on stderr.
export const questNodeDispatchRunnerBrokerProxy = (): Record<PropertyKey, never> => {
  stderrProxy();
  return {};
};
