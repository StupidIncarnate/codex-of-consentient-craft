import { TimeoutMsStub } from '@dungeonmaster/shared/contracts';

import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';

import { DriverServeLayerResponder } from './driver-serve-layer-responder';
import { DriverServeLayerResponderProxy } from './driver-serve-layer-responder.proxy';

const flush = async (): Promise<void> => {
  await new Promise((resolve) => {
    setImmediate(resolve);
  });
};

describe('DriverServeLayerResponder', () => {
  describe('a request arrives over the socket', () => {
    it('VALID: {ping} => writes the handled response back over the socket', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageHandleRequestResponds({
        response: DriverResponseStub({ ok: true, payload: '{"alive":true}', error: null }),
      });
      proxy.stageIdleWaitResolves({ killed: false });

      const resultPromise = DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });
      const writes = proxy.sendSocketFrame({ frame: '{"kind":"ping","payload":""}\n' });
      await flush();
      await resultPromise;
      await flush();

      expect(writes).toStrictEqual(['{"ok":true,"payload":"{\\"alive\\":true}","error":null}\n']);
    });
  });

  describe('the idle wait resolves NOT killed', () => {
    it('VALID: {idle timeout} => tears the lane down exactly once', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: false });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });

      expect(proxy.getLaneTeardownCallCount()).toBe(1);
    });

    it('VALID: {idle timeout} => releases the registry row exactly once', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: false });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });

      expect(proxy.getInstanceReleaseCallCount()).toBe(1);
    });

    it('VALID: {default idle ceiling} => writes shutdown-reason.json naming the 900s default, before teardown', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: false });
      const instanceId = InstanceIdStub();

      await DriverServeLayerResponder({ instanceId, guildId: null, lane: LaneSessionStub() });

      expect(proxy.getShutdownReasonWriteCallArgs()).toStrictEqual({
        evidencePath: '/tmp/dm-siege-evidence-test/inst-serve-test',
        reason: 'reaped by idle timeout after 900s with no run received',
      });
    });

    it('VALID: {a raised idle ceiling} => writes shutdown-reason.json naming THAT ceiling, not the default', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: false });
      const instanceId = InstanceIdStub();

      await DriverServeLayerResponder({
        instanceId,
        guildId: null,
        lane: LaneSessionStub(),
        idleTimeoutMs: TimeoutMsStub({ value: 1_800_000 }),
      });

      expect(proxy.getShutdownReasonWriteCallArgs()).toStrictEqual({
        evidencePath: '/tmp/dm-siege-evidence-test/inst-serve-test',
        reason: 'reaped by idle timeout after 1800s with no run received',
      });
    });
  });

  describe('the idle wait resolves killed', () => {
    it('VALID: {already killed} => does not tear the lane down again', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: true });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });

      expect(proxy.getLaneTeardownCallCount()).toBe(0);
    });

    it('VALID: {already killed} => never writes a shutdown-reason marker — the caller already knows why', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: true });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });

      expect(proxy.getShutdownReasonWriteCallArgs()).toBe(undefined);
    });
  });

  describe('closing the socket', () => {
    it('VALID: {idle wait resolves killed} => closes the socket server exactly once', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: true });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });

      expect(proxy.getSocketCloseCallCount()).toBe(1);
    });

    it('VALID: {idle wait resolves NOT killed} => closes the socket server exactly once', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: false });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });

      expect(proxy.getSocketCloseCallCount()).toBe(1);
    });
  });

  describe('the heartbeat ticker', () => {
    it('VALID: {a tick throws} => reports the failure and the interval keeps ticking', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: false });
      proxy.stageHeartbeatTickFails({ error: new Error('disk full') });

      const resultPromise = DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });
      proxy.fireHeartbeatTick();
      await flush();
      proxy.fireHeartbeatTick();
      await flush();
      await resultPromise;

      expect(proxy.getStderrWrites().length).toBeGreaterThan(0);
    });
  });

  describe('an OS signal arrives', () => {
    it('VALID: {SIGINT} => tears the lane down', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: false });

      const resultPromise = DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });
      proxy.fireSignal({ signal: 'SIGINT' });
      await flush();
      await resultPromise;

      expect(proxy.getLaneTeardownCallCount()).toBe(1);
    });
  });
});
