/**
 * PURPOSE: Test proxy for install run broker
 *
 * USAGE:
 * const proxy = installRunBrokerProxy();
 * proxy.setupPackagesAndResults({ packages, results });
 */

import { packageDiscoverBrokerProxy } from '../../package/discover/package-discover-broker.proxy';
import { installOrchestrateBrokerProxy } from '../orchestrate/install-orchestrate-broker.proxy';

export const installRunBrokerProxy = (): {
  packageDiscoverProxy: ReturnType<typeof packageDiscoverBrokerProxy>;
  installOrchestratProxy: ReturnType<typeof installOrchestrateBrokerProxy>;
} => {
  const packageDiscoverProxy = packageDiscoverBrokerProxy();
  const installOrchestratProxy = installOrchestrateBrokerProxy();

  return {
    packageDiscoverProxy,
    installOrchestratProxy,
  };
};
