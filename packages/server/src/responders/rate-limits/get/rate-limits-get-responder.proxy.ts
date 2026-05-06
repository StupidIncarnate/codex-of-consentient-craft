import type { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetRateLimitsAdapterProxy } from '../../../adapters/orchestrator/get-rate-limits/orchestrator-get-rate-limits-adapter.proxy';
import { RateLimitsGetResponder } from './rate-limits-get-responder';

type RateLimitsSnapshot = ReturnType<typeof RateLimitsSnapshotStub>;

export const RateLimitsGetResponderProxy = (): {
  setupSnapshot: (params: { snapshot: RateLimitsSnapshot | null }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof RateLimitsGetResponder;
} => {
  const adapterProxy = orchestratorGetRateLimitsAdapterProxy();

  return {
    setupSnapshot: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }): void => {
      adapterProxy.returns({ snapshot });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: RateLimitsGetResponder,
  };
};
