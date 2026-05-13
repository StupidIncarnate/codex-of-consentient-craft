import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';
import { processStaleWatchBroker } from './process-stale-watch-broker';
import { processStaleWatchBrokerProxy } from './process-stale-watch-broker.proxy';

describe('processStaleWatchBroker', () => {
  describe('silence threshold', () => {
    it('VALID: {process silent for exactly 90s, threshold 60s} => onStale fires with silentForMs=90_000', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-05-12T22:58:24.835Z'));
      const proxy = processStaleWatchBrokerProxy();
      proxy.setupAlive();
      const processId = ProcessIdStub({ value: 'proc-stale' });
      const ninetySecondsAgo = new Date(Date.now() - 90_000);
      const onStale = jest.fn();
      processStaleWatchBroker({
        getProcessIds: () => [processId],
        getActivity: () => ({ lastActivityAt: ninetySecondsAgo }),
        onStale,
        intervalMs: 1000,
        thresholdMs: 60_000,
      });
      proxy.triggerTick();
      jest.useRealTimers();

      expect(onStale).toHaveBeenCalledWith({
        processId,
        silentForMs: 90_000,
        pid: undefined,
        alive: undefined,
      });
    });

    it('VALID: {process active 5s ago, threshold 60s} => onStale fires 0 times', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-05-12T22:58:24.835Z'));
      const proxy = processStaleWatchBrokerProxy();
      proxy.setupAlive();
      const fiveSecondsAgo = new Date(Date.now() - 5_000);
      const onStale = jest.fn();
      processStaleWatchBroker({
        getProcessIds: () => [ProcessIdStub({ value: 'proc-active' })],
        getActivity: () => ({ lastActivityAt: fiveSecondsAgo }),
        onStale,
        intervalMs: 1000,
        thresholdMs: 60_000,
      });
      proxy.triggerTick();
      jest.useRealTimers();

      expect(onStale).toHaveBeenCalledTimes(0);
    });
  });

  describe('liveness probe', () => {
    it('VALID: {stale process with osPid, alive} => onStale fires with alive=true, pid set, silentForMs=120_000', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-05-12T22:58:24.835Z'));
      const proxy = processStaleWatchBrokerProxy();
      proxy.setupAlive();
      const pid = ProcessPidStub({ value: 812325 });
      const longAgo = new Date(Date.now() - 120_000);
      const onStale = jest.fn();
      processStaleWatchBroker({
        getProcessIds: () => [ProcessIdStub({ value: 'proc-1' })],
        getActivity: () => ({ lastActivityAt: longAgo, osPid: pid }),
        onStale,
        intervalMs: 1000,
        thresholdMs: 60_000,
      });
      proxy.triggerTick();
      jest.useRealTimers();

      expect(onStale).toHaveBeenCalledWith({
        processId: ProcessIdStub({ value: 'proc-1' }),
        silentForMs: 120_000,
        pid,
        alive: true,
      });
    });

    it('VALID: {stale process with osPid, dead} => onStale fires with alive=false', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-05-12T22:58:24.835Z'));
      const proxy = processStaleWatchBrokerProxy();
      proxy.setupDead();
      const pid = ProcessPidStub({ value: 999999 });
      const longAgo = new Date(Date.now() - 120_000);
      const onStale = jest.fn();
      processStaleWatchBroker({
        getProcessIds: () => [ProcessIdStub({ value: 'proc-dead' })],
        getActivity: () => ({ lastActivityAt: longAgo, osPid: pid }),
        onStale,
        intervalMs: 1000,
        thresholdMs: 60_000,
      });
      proxy.triggerTick();
      jest.useRealTimers();

      expect(onStale).toHaveBeenCalledWith({
        processId: ProcessIdStub({ value: 'proc-dead' }),
        silentForMs: 120_000,
        pid,
        alive: false,
      });
    });
  });

  describe('missing activity', () => {
    it('EMPTY: {processId registered but no activity entry} => onStale fires 0 times', () => {
      const proxy = processStaleWatchBrokerProxy();
      proxy.setupAlive();
      const onStale = jest.fn();
      processStaleWatchBroker({
        getProcessIds: () => [ProcessIdStub({ value: 'proc-ghost' })],
        getActivity: () => undefined,
        onStale,
        intervalMs: 1000,
        thresholdMs: 60_000,
      });
      proxy.triggerTick();

      expect(onStale).toHaveBeenCalledTimes(0);
    });
  });
});
