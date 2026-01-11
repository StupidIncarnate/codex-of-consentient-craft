/**
 * PURPOSE: Test proxy for useInstallBinding - delegates to broker proxy
 *
 * USAGE:
 * const proxy = useInstallBindingProxy();
 * proxy.setupInstallSuccess({ results });
 */
import { installRunBrokerProxy } from '../../brokers/install/run/install-run-broker.proxy';

export const useInstallBindingProxy = (): {
  installRunProxy: ReturnType<typeof installRunBrokerProxy>;
} => {
  const installRunProxy = installRunBrokerProxy();

  return {
    installRunProxy,
  };
};
