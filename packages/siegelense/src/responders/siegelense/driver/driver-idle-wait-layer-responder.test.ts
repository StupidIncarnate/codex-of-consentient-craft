import { TimeoutMsStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';

import { DriverIdleWaitLayerResponder } from './driver-idle-wait-layer-responder';
import { DriverIdleWaitLayerResponderProxy } from './driver-idle-wait-layer-responder.proxy';

describe('DriverIdleWaitLayerResponder', () => {
  describe('a kill already settled the lane', () => {
    it('EMPTY: {lane already cleared} => resolves true immediately', async () => {
      const proxy = DriverIdleWaitLayerResponderProxy();
      proxy.setupKilledAlready();
      const killSignal = new Promise<true>(() => {
        // Never resolves in this test — the lane is already cleared, so the function must return
        // before it is ever raced against.
      });

      const wasKilled = await DriverIdleWaitLayerResponder({ killSignal });

      expect(wasKilled).toBe(true);
    });
  });

  describe('the kill signal settles first', () => {
    it('VALID: {killSignal already resolved} => resolves true without needing the deadline to pass', async () => {
      const proxy = DriverIdleWaitLayerResponderProxy();
      proxy.setupLaneReady({ nowMs: EpochMsStub({ value: 1_000 }) });
      proxy.stageNow({ ms: EpochMsStub({ value: 2_000 }) });
      const killSignal = Promise.resolve(true as const);

      const wasKilled = await DriverIdleWaitLayerResponder({ killSignal });

      expect(wasKilled).toBe(true);
    });
  });

  describe('a caller raised the idle ceiling', () => {
    it('VALID: {idleTimeoutMs: 1_800_000, nowMs past the DEFAULT 900s deadline but before the raised one} => keeps waiting instead of tearing down', async () => {
      const proxy = DriverIdleWaitLayerResponderProxy();
      proxy.setupLaneReadyWithIdleTimeout({
        nowMs: EpochMsStub({ value: 1_000 }),
        idleTimeoutMs: TimeoutMsStub({ value: 1_800_000 }),
      });
      // 901_000 is past the DEFAULT deadline (1_000 + 900_000) but well before the raised one
      // (1_000 + 1_800_000 = 1_801_000) — resolving false here would mean the override never
      // reached the deadline computation.
      proxy.stageNow({ ms: EpochMsStub({ value: 901_000 }) });
      const killSignal = new Promise<true>(() => {
        // Never resolves — only the scheduled sleep is observed.
      });

      DriverIdleWaitLayerResponder({ killSignal }).catch((error: unknown) => {
        throw error;
      });
      await Promise.resolve();

      expect(proxy.getScheduledMs()).toBe(1_801_000 - 901_000);
    });
  });

  describe('the idle window has already elapsed', () => {
    it('VALID: {nowMs past the deadline} => resolves false without scheduling a sleep', async () => {
      const proxy = DriverIdleWaitLayerResponderProxy();
      proxy.setupLaneReady({ nowMs: EpochMsStub({ value: 1_000 }) });
      proxy.stageNow({ ms: EpochMsStub({ value: 901_001 }) });
      const killSignal = new Promise<true>(() => {
        // Never resolves — the deadline has already passed on the first check.
      });

      const wasKilled = await DriverIdleWaitLayerResponder({ killSignal });

      expect(wasKilled).toBe(false);
    });
  });

  describe('activity touched the state before the deadline check', () => {
    it('VALID: {nowMs past the ORIGINAL deadline but before the extended one} => schedules another sleep instead of tearing down', async () => {
      const proxy = DriverIdleWaitLayerResponderProxy();
      proxy.setupLaneReady({ nowMs: EpochMsStub({ value: 1_000 }) });
      proxy.touch({ nowMs: EpochMsStub({ value: 500_000 }) });
      // 901_500 is past the ORIGINAL deadline (1_000 + 900_000 = 901_000) but well before the
      // extended one (500_000 + 900_000 = 1_400_000) — resolving false here would be the exact bug
      // this test exists to catch.
      proxy.stageNow({ ms: EpochMsStub({ value: 901_500 }) });
      const killSignal = new Promise<true>(() => {
        // Never resolves in this test — only the scheduled sleep is observed.
      });

      DriverIdleWaitLayerResponder({ killSignal }).catch((error: unknown) => {
        throw error;
      });
      await Promise.resolve();

      expect(proxy.getScheduledMs()).toBe(1_400_000 - 901_500);
    });
  });
});
