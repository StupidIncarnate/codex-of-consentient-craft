import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { LaneSessionStub } from '../../contracts/lane-session/lane-session.stub';
import { driverSessionState } from './driver-session-state';
import { driverSessionStateProxy } from './driver-session-state.proxy';

describe('driverSessionState', () => {
  describe('lane()', () => {
    it('EMPTY: {no lane set} => returns null', () => {
      const proxy = driverSessionStateProxy();
      proxy.setupEmpty();

      expect(driverSessionState.lane()).toBe(null);
    });

    it('VALID: {set with a lane} => returns that same lane', () => {
      const proxy = driverSessionStateProxy();
      proxy.setupEmpty();
      const lane = LaneSessionStub();

      driverSessionState.set({ lane });

      expect(driverSessionState.lane()).toBe(lane);
    });
  });

  describe('nextRunId()', () => {
    it('VALID: {two calls} => returns run_1 then run_2', () => {
      const proxy = driverSessionStateProxy();
      proxy.setupEmpty();

      const first = driverSessionState.nextRunId();
      const second = driverSessionState.nextRunId();

      expect(first).toBe('run_1');
      expect(second).toBe('run_2');
    });
  });

  describe('touch() and lastActivityMs()', () => {
    it('VALID: {set} => stamps lastActivityMs to Date.now() at set time', () => {
      const proxy = driverSessionStateProxy();
      proxy.setupEmpty();
      const nowHandle = registerSpyOn({ object: Date, method: 'now' });
      nowHandle.calledWith([]).returns(1_700_000_000_000);

      driverSessionState.set({ lane: LaneSessionStub() });

      expect(driverSessionState.lastActivityMs()).toBe(1_700_000_000_000);
    });

    it('VALID: {touch after set} => advances lastActivityMs to the new Date.now()', () => {
      const proxy = driverSessionStateProxy();
      proxy.setupEmpty();
      const nowHandle = registerSpyOn({ object: Date, method: 'now' });
      nowHandle.onceFor([]).returns(1_700_000_000_000);
      driverSessionState.set({ lane: LaneSessionStub() });
      nowHandle.onceFor([]).returns(1_700_000_005_000);

      driverSessionState.touch();

      expect(driverSessionState.lastActivityMs()).toBe(1_700_000_005_000);
    });
  });

  describe('clear()', () => {
    it('VALID: {clear after set} => lane() reads null again', () => {
      const proxy = driverSessionStateProxy();
      proxy.setupEmpty();
      driverSessionState.set({ lane: LaneSessionStub() });

      driverSessionState.clear();

      expect(driverSessionState.lane()).toBe(null);
    });

    it('VALID: {clear after minting a run id} => the next id restarts at run_1', () => {
      const proxy = driverSessionStateProxy();
      proxy.setupEmpty();
      driverSessionState.nextRunId();
      driverSessionState.nextRunId();

      driverSessionState.clear();

      expect(driverSessionState.nextRunId()).toBe('run_1');
    });
  });
});
