
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';

import { DriverServeLayerResponder } from './driver-serve-layer-responder';
import { DriverServeLayerResponderProxy } from './driver-serve-layer-responder.proxy';
import { setImmediate } from '#gateway/node/setImmediate';

const flush = async (): Promise<void> => {
  await new Promise((resolve) => {
    setImmediate(resolve);
  });
};

describe('DriverServeLayerResponder', () => {
  describe('a request arrives over the socket', () => {
    it('VALID: {ping} => writes the handled response back as one JSON line', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageHandleRequestResponds({
        response: DriverResponseStub({ ok: true, payload: '{"alive":true}', error: null }),
      });
      // Killed, so the lane stays set after the serve returns and the request reaches the handler.
      proxy.stageIdleWaitResolves({ killed: true });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });
      const client = proxy.sendSocketLine({ line: '{"kind":"ping","payload":""}' });
      await flush();

      expect(client.getWrittenLines()).toStrictEqual([
        '{"ok":true,"payload":"{\\"alive\\":true}","error":null}',
      ]);
    });

    it('INVALID: {line: not JSON} => answers a malformed-frame response and never reaches the handler', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: true });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });
      const client = proxy.sendSocketLine({ line: 'not-json' });
      await flush();

      const [written] = client.getWrittenLines();

      expect(JSON.parse(String(written))).toStrictEqual({
        ok: false,
        payload: '',
        error: expect.stringMatching(/^Malformed request frame: SyntaxError: .+$/u),
      });
      expect(proxy.getHandleRequestCallCount()).toBe(0);
    });

    it('INVALID: {line: JSON missing kind} => answers a malformed-frame response and never reaches the handler', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: true });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });
      const client = proxy.sendSocketLine({ line: '{"payload":""}' });
      await flush();
      const [written] = client.getWrittenLines();

      expect(JSON.parse(String(written))).toStrictEqual({
        ok: false,
        payload: '',
        error: `Malformed request frame: ${JSON.stringify(
          [
            {
              code: 'invalid_value',
              values: ['ping', 'run', 'kill'],
              path: ['kind'],
              message: 'Invalid option: expected one of "ping"|"run"|"kill"',
            },
          ],
          null,
          2,
        )}`,
      });
      expect(proxy.getHandleRequestCallCount()).toBe(0);
    });

    it('ERROR: {handler rejects} => answers an ok:false frame carrying the error', async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageHandleRequestFails({ error: new Error('browser crashed') });
      proxy.stageIdleWaitResolves({ killed: true });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });
      const client = proxy.sendSocketLine({ line: '{"kind":"ping","payload":""}' });
      await flush();

      expect(client.getWrittenLines()).toStrictEqual([
        '{"ok":false,"payload":"","error":"Error: browser crashed"}',
      ]);
    });
  });

  describe('binding the socket', () => {
    it("VALID: {instanceId} => creates the socket's parent directory before binding", async () => {
      const proxy = DriverServeLayerResponderProxy();
      proxy.stageIdleWaitResolves({ killed: true });

      await DriverServeLayerResponder({
        instanceId: InstanceIdStub(),
        guildId: null,
        lane: LaneSessionStub(),
      });

      expect(proxy.getSocketDirCreateCalls()).toStrictEqual([
        ['/tmp/dm-siege-sockets', { recursive: true }],
      ]);
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
        evidencePath: '/tmp/dm-siege-evidence-test/unowned/instances/inst_7f3a9c21',
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
        idleTimeoutMs: 1_800_000,
      });

      expect(proxy.getShutdownReasonWriteCallArgs()).toStrictEqual({
        evidencePath: '/tmp/dm-siege-evidence-test/unowned/instances/inst_7f3a9c21',
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
