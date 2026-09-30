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

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { clearTimeoutProxy } from '#gateway/node/clearTimeout/clear-timeout/clear-timeout.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { driverSessionState } from '../../../state/driver-session/driver-session-state';
import { driverSessionStateProxy } from '../../../state/driver-session/driver-session-state.proxy';

export const DriverIdleWaitLayerResponderProxy = (): {
  setupLaneReady: (params: { nowMs: number }) => void;
  setupLaneReadyWithIdleTimeout: (params: { nowMs: number; idleTimeoutMs: number }) => void;
  setupKilledAlready: () => void;
  touch: (params: { nowMs: number }) => void;
  stageNow: (params: { ms: number }) => void;
  stageSleepNeverFires: (params: { ms: number }) => void;
  getSleepCallCount: (params: { ms: number }) => number;
} => {
  const sessionProxy = driverSessionStateProxy();
  sessionProxy.setupEmpty();

  const nowHandle = registerSpyOn({ object: Date, method: 'now' });
  const timeoutProxy = setTimeoutProxy();
  clearTimeoutProxy();

  return {
    setupLaneReady: ({ nowMs }: { nowMs: number }): void => {
      nowHandle.onceFor([]).returns(nowMs);
      driverSessionState.set({ lane: LaneSessionStub() });
    },

    setupLaneReadyWithIdleTimeout: ({
      nowMs,
      idleTimeoutMs,
    }: {
      nowMs: number;
      idleTimeoutMs: number;
    }): void => {
      nowHandle.onceFor([]).returns(nowMs);
      driverSessionState.set({ lane: LaneSessionStub(), idleTimeoutMs });
    },

    setupKilledAlready: (): void => {
      driverSessionState.clear();
    },

    touch: ({ nowMs }: { nowMs: number }): void => {
      nowHandle.onceFor([]).returns(nowMs);
      driverSessionState.touch();
    },

    stageNow: ({ ms }: { ms: number }): void => {
      nowHandle.onceFor([]).returns(ms);
    },

    stageSleepNeverFires: ({ ms }: { ms: number }): void => {
      timeoutProxy.setupNeverFires({ ms });
    },

    getSleepCallCount: ({ ms }: { ms: number }): number => timeoutProxy.getCallsFor({ ms }).length,
  };
};
