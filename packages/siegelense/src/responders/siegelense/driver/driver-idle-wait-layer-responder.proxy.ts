/**
 * PURPOSE: Test proxy for DriverIdleWaitLayerResponder — stages driverSessionState directly (it runs
 * real, per state/'s own testing convention) and mocks Date.now plus the global setTimeout so a test
 * never waits out a real idle window. `setTimeout` is captured rather than auto-fired, so a test
 * controls exactly when the recursion's sleep settles.
 *
 * USAGE:
 * const proxy = DriverIdleWaitLayerResponderProxy();
 * proxy.setupLaneReady({ nowMs: EpochMsStub({ value: 1_000 }) });
 * proxy.stageNow({ ms: EpochMsStub({ value: 2_000 }) });
 */

import { timeoutMsContract } from '@dungeonmaster/shared/contracts';
import type { TimeoutMs } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { driverSessionState } from '../../../state/driver-session/driver-session-state';
import { driverSessionStateProxy } from '../../../state/driver-session/driver-session-state.proxy';

export const DriverIdleWaitLayerResponderProxy = (): {
  setupLaneReady: (params: { nowMs: EpochMs }) => void;
  setupLaneReadyWithIdleTimeout: (params: { nowMs: EpochMs; idleTimeoutMs: TimeoutMs }) => void;
  setupKilledAlready: () => void;
  touch: (params: { nowMs: EpochMs }) => void;
  stageNow: (params: { ms: EpochMs }) => void;
  getScheduledMs: () => TimeoutMs | undefined;
} => {
  const sessionProxy = driverSessionStateProxy();
  sessionProxy.setupEmpty();

  const nowHandle = registerSpyOn({ object: Date, method: 'now' });
  const scheduled: TimeoutMs[] = [];
  const timeoutHandle = registerSpyOn({ object: globalThis, method: 'setTimeout' });
  timeoutHandle.calledWith([]).implement(((_callback: () => void, ms: number) => {
    scheduled.push(timeoutMsContract.parse(ms));
    return { unref: (): void => undefined } as unknown as NodeJS.Timeout;
  }) as typeof setTimeout);

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

    getScheduledMs: (): TimeoutMs | undefined => scheduled.at(-1),
  };
};
