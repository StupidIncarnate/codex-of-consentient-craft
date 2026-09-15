import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { stepDispatchBrokerProxy } from '../../step/dispatch/step-dispatch-broker.proxy';

// stepDispatchBrokerProxy() itself stages Date.now to a fixed value (1_700_000_000_000) — this
// proxy relies on that staging rather than repeating it, since a second registerSpyOn on the same
// global would only collide with an identical value. A test asserting startedAtMs/endedAtMs
// hardcodes that same literal, the same way step-dispatch-broker.test.ts does.
export const runExecuteStepLayerBrokerProxy = (): {
  laneGotoSucceeds: () => LaneSession;
  laneGotoRejects: (params: { error: Error }) => LaneSession;
} => {
  stepDispatchBrokerProxy();

  return {
    laneGotoSucceeds: (): LaneSession =>
      LaneSessionStub({
        browser: { goto: jest.fn().mockResolvedValue(undefined) },
      }),

    laneGotoRejects: ({ error }: { error: Error }): LaneSession =>
      LaneSessionStub({
        browser: { goto: jest.fn().mockRejectedValue(error) },
      }),
  };
};
