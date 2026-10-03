import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts/rate-limits-snapshot/rate-limits-snapshot.stub';

import { RateLimitsGetResponder } from './rate-limits-get-responder';

type RateLimitsSnapshot = ReturnType<typeof RateLimitsSnapshotStub>;

export const RateLimitsGetResponderProxy = (): {
  setupSnapshot: (params: { snapshot: RateLimitsSnapshot | null }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof RateLimitsGetResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupSnapshot: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }): void => {
      orchestrator.getRateLimitsReturns({ snapshot });
    },
    setupError: ({ message }: { message: string }): void => {
      orchestrator.getRateLimitsThrows({ error: NativeErrorStub({ message }) });
    },
    callResponder: RateLimitsGetResponder,
  };
};
