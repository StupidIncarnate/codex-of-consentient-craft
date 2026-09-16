// PURPOSE: Proxy for lane-ready-wait-broker — delegates to fetch-probe-adapter's proxy for
// reachability, and stages Date.now ONLY when a test asks for a deadline-exceeded case. Staging the
// clock in the constructor unconditionally would spy on every Date.now() call for the rest of the
// test, including ones this scenario never described — a reachable-on-first-probe test never calls
// Date.now() at all, so an unconditional spy throws "nothing set up for the call now()" on the
// first unrelated read anywhere in the process.
// USAGE: const proxy = laneReadyWaitBrokerProxy(); proxy.setupReachable({ url });

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fetchProbeAdapterProxy } from '../../../adapters/fetch/probe/fetch-probe-adapter.proxy';

export const laneReadyWaitBrokerProxy = (): {
  setupReachable: (params: { url: string }) => void;
  setupUnreachable: (params: { url: string }) => void;
  stageDeadlineExceeded: (params: { firstCallMs: number; thenMs: number }) => void;
} => {
  const fetchProxy = fetchProbeAdapterProxy();

  return {
    setupReachable: ({ url }: { url: string }): void => {
      fetchProxy.setupReachable({ url });
    },

    setupUnreachable: ({ url }: { url: string }): void => {
      fetchProxy.setupUnreachable({ url });
    },

    // `firstCallMs` answers the FIRST Date.now() call anywhere in the current test (a composing
    // caller's own deadline computation, when one exists); `thenMs` answers every call after —
    // comfortably past any deadline, so a post-probe check reports "expired" immediately.
    stageDeadlineExceeded: ({
      firstCallMs,
      thenMs,
    }: {
      firstCallMs: number;
      thenMs: number;
    }): void => {
      const dateHandle = registerSpyOn({ object: Date, method: 'now' });
      dateHandle.onceFor([]).returns(firstCallMs);
      dateHandle.calledWith([]).returns(thenMs);
    },
  };
};
