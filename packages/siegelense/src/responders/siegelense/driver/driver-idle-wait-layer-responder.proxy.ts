/**
 * PURPOSE: Test proxy for DriverIdleWaitLayerResponder — stages driverSessionState directly (it runs
 * real, per state/'s own testing convention) and mocks Date.now plus the global setTimeout so a test
 * never waits out a real idle window. A sleep is staged by its exact period and never fires, so a
 * test reads back whether the recursion scheduled that period.
 *
 * USAGE:
 * const proxy = DriverIdleWaitLayerResponderProxy();
 * proxy.setupLaneReady({ nowMs: EpochMsStub({ value: 1_000 }) });
 * proxy.stageNow({ ms: EpochMsStub({ value: 2_000 }) });
 */

import type { TimeoutMs } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { clearTimeoutProxy } from '#gateway/node/clearTimeout/clear-timeout/clear-timeout.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';

import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { driverSessionState } from '../../../state/driver-session/driver-session-state';
import { driverSessionStateProxy } from '../../../state/driver-session/driver-session-state.proxy';

export const DriverIdleWaitLayerResponderProxy = (): {
  setupLaneReady: (params: { nowMs: EpochMs }) => void;
  setupLaneReadyWithIdleTimeout: (params: { nowMs: EpochMs; idleTimeoutMs: TimeoutMs }) => void;
  setupKilledAlready: () => void;
  touch: (params: { nowMs: EpochMs }) => void;
  stageNow: (params: { ms: EpochMs }) => void;
  stageSleepNeverFires: (params: { ms: TimeoutMs }) => void;
  getSleepCallCount: (params: { ms: TimeoutMs }) => ReturnType<typeof ReadingCountStub>;
} => {
  const sessionProxy = driverSessionStateProxy();
  sessionProxy.setupEmpty();

  const nowHandle = registerSpyOn({ object: Date, method: 'now' });
  const timeoutProxy = setTimeoutProxy();
  clearTimeoutProxy();

  return {
    setupLaneReady: ({ nowMs }: { nowMs: EpochMs }): void => {
      nowHandle.onceFor([]).returns(nowMs);
      driverSessionState.set({ lane: LaneSessionStub() });
    },

    setupLaneReadyWithIdleTimeout: ({
      nowMs,
      idleTimeoutMs,
    }: {
      nowMs: EpochMs;
      idleTimeoutMs: TimeoutMs;
    }): void => {
      nowHandle.onceFor([]).returns(nowMs);
      driverSessionState.set({ lane: LaneSessionStub(), idleTimeoutMs });
    },

    setupKilledAlready: (): void => {
      driverSessionState.clear();
    },

    touch: ({ nowMs }: { nowMs: EpochMs }): void => {
      nowHandle.onceFor([]).returns(nowMs);
      driverSessionState.touch();
    },

    stageNow: ({ ms }: { ms: EpochMs }): void => {
      nowHandle.onceFor([]).returns(ms);
    },

    stageSleepNeverFires: ({ ms }: { ms: TimeoutMs }): void => {
      timeoutProxy.setupNeverFires({ ms });
    },

    getSleepCallCount: ({ ms }: { ms: TimeoutMs }): ReturnType<typeof ReadingCountStub> =>
      ReadingCountStub({ value: timeoutProxy.getCallsFor({ ms }).length }),
  };
};
