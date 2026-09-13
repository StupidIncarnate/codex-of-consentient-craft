import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { rateLimitsWatchBrokerProxy } from '../../../brokers/rate-limits/watch/rate-limits-watch-broker.proxy';
import { rateLimitsBootstrapStateProxy } from '../../../state/rate-limits-bootstrap/rate-limits-bootstrap-state.proxy';

import { EvaluateHoldLayerResponder } from './evaluate-hold-layer-responder';
import { EvaluateHoldLayerResponderProxy } from './evaluate-hold-layer-responder.proxy';

// The layer owns the whole fs chain behind the guardrail (read dispatch-state, maybe write it), and
// what it DECIDES is graded by dispatchHoldEvaluateBroker's own test. What THIS responder is
// responsible for is firing it at the right three moments, so the layer is replaced here and the
// tests assert when it actually ran.
registerModuleMock({ module: './evaluate-hold-layer-responder' });

export const RateLimitsBootstrapResponderProxy = (): {
  setupReadSucceeds: ({ contents }: { contents: string }) => void;
  setupReadEnoent: () => void;
  triggerTick: () => void;
  evaluationCalls: () => unknown[][];
  reset: () => void;
} => {
  const bootstrapState = rateLimitsBootstrapStateProxy();
  EvaluateHoldLayerResponderProxy();
  // RateLimitsBootstrapResponder calls rateLimitsWatchBroker with its own default
  // DEFAULT_POLL_INTERVAL_MS (5000ms) when DUNGEONMASTER_RATE_LIMITS_POLL_MS is unset — not
  // exported, so this address is duplicated here rather than imported.
  const watchProxy = rateLimitsWatchBrokerProxy({ intervalMs: 5000 });

  const evaluateMock = EvaluateHoldLayerResponder as jest.MockedFunction<
    typeof EvaluateHoldLayerResponder
  >;
  evaluateMock.mockReturnValue({ success: true });

  return {
    setupReadSucceeds: watchProxy.setupReadSucceeds,
    setupReadEnoent: watchProxy.setupReadEnoent,
    triggerTick: watchProxy.triggerTick,

    evaluationCalls: (): unknown[][] => evaluateMock.mock.calls,

    reset: (): void => {
      bootstrapState.reset();
    },
  };
};
