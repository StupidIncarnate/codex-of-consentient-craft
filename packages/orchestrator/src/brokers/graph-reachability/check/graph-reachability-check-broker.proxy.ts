/**
 * PURPOSE: Proxy for graphReachabilityCheckBroker — the broker reads only statics and runs a pure
 * transformer, so it has no I/O boundary to mock. A caller that needs a chosen violation list
 * stages it here instead of registering the broker itself.
 *
 * USAGE:
 * const proxy = graphReachabilityCheckBrokerProxy();
 * proxy.setupClean(); // graphReachabilityCheckBroker() returns []
 * proxy.setupViolation({ message: 'family graph has an unreachable node' });
 *
 * The real broker stays the default, so a caller that stages nothing gets the genuine check.
 */

import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { graphReachabilityCheckBroker } from './graph-reachability-check-broker';

registerModuleMock({ module: './graph-reachability-check-broker' });

export const graphReachabilityCheckBrokerProxy = (): {
  setupClean: () => void;
  setupViolation: (params: { message: string }) => void;
} => {
  const realMod = requireActual<{
    graphReachabilityCheckBroker: typeof graphReachabilityCheckBroker;
  }>({
    module: './graph-reachability-check-broker',
  });
  const handle = registerMock({ fn: graphReachabilityCheckBroker });
  // Zero-argument broker: `[]` is its only address, and the passthrough keeps every caller that
  // stages nothing on the real check.
  handle.calledWith([]).implement(realMod.graphReachabilityCheckBroker as never);

  return {
    setupClean: (): void => {
      handle.calledWith([]).returns([]);
    },
    setupViolation: ({ message }: { message: string }): void => {
      handle.calledWith([]).returns([ErrorMessageStub({ value: message })]);
    },
  };
};
