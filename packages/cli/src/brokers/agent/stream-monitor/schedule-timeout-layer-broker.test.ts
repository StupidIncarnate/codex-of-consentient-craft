import { scheduleTimeoutLayerBroker } from './schedule-timeout-layer-broker';
import { scheduleTimeoutLayerBrokerProxy } from './schedule-timeout-layer-broker.proxy';
import { MonitorStateStub } from '../../../contracts/monitor-state/monitor-state.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { TimerIdStub } from '../../../contracts/timer-id/timer-id.stub';
import { TimedOutFlagStub } from '../../../contracts/timed-out-flag/timed-out-flag.stub';
import { EventEmittingProcessStub } from '../../../contracts/event-emitting-process/event-emitting-process.stub';

describe('scheduleTimeoutLayerBroker', () => {
  describe('scheduling timeout', () => {
    it('VALID: {no existing timer} => schedules new timeout and returns timer ID', () => {
      const proxy = scheduleTimeoutLayerBrokerProxy();
      const expectedTimerId = proxy.setupNeverFire();

      const state = MonitorStateStub();
      const childProcess = EventEmittingProcessStub();
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      const timerId = scheduleTimeoutLayerBroker({
        state,
        childProcess,
        timeoutMs,
      });

      expect(timerId).toBe(expectedTimerId);
    });

    it('VALID: {existing timer} => clears old timer and schedules new', () => {
      const proxy = scheduleTimeoutLayerBrokerProxy();
      const expectedNewTimerId = proxy.setupNeverFire();

      const existingTimerId = TimerIdStub({ value: 11111 });
      const state = MonitorStateStub({ timerId: existingTimerId });
      const childProcess = EventEmittingProcessStub();
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      const newTimerId = scheduleTimeoutLayerBroker({
        state,
        childProcess,
        timeoutMs,
      });

      expect(proxy.getClearedTimerId()).toBe(existingTimerId);
      expect(newTimerId).toBe(expectedNewTimerId);
    });
  });

  describe('timeout callback', () => {
    it('VALID: {timeout fires} => sets timedOut flag to true', async () => {
      const proxy = scheduleTimeoutLayerBrokerProxy();
      proxy.setupImmediate();

      const state = MonitorStateStub();
      const childProcess = EventEmittingProcessStub();
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      scheduleTimeoutLayerBroker({
        state,
        childProcess,
        timeoutMs,
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(state.timedOut).toBe(TimedOutFlagStub({ value: true }));
    });

    it('VALID: {timeout fires} => kills child process', async () => {
      const proxy = scheduleTimeoutLayerBrokerProxy();
      proxy.setupImmediate();

      const killMock = jest.fn().mockReturnValue(true);
      const state = MonitorStateStub();
      const childProcess = EventEmittingProcessStub({ kill: killMock });
      const timeoutMs = TimeoutMsStub({ value: 60000 });

      scheduleTimeoutLayerBroker({
        state,
        childProcess,
        timeoutMs,
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(killMock).toHaveBeenCalledTimes(1);
    });
  });
});
