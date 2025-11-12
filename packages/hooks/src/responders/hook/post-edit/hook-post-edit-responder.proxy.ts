/**
 * PURPOSE: Proxy for hook-post-edit-responder that delegates to broker proxies
 *
 * USAGE:
 * const proxy = HookPostEditResponderProxy();
 * proxy.setupPostEdit({ hasViolations: true });
 */
import { violationsFixAndReportBrokerProxy } from '../../../brokers/violations/fix-and-report/violations-fix-and-report-broker.proxy';

export const HookPostEditResponderProxy = (): {
  setupPostEdit: (params?: { hasViolations?: boolean }) => void;
} => {
  const brokerProxy = violationsFixAndReportBrokerProxy();

  return {
    setupPostEdit: ({ hasViolations = false }: { hasViolations?: boolean } = {}): void => {
      brokerProxy.setupFixAndReport({ hasViolations });
    },
  };
};
