import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { DriverRequestStub } from '../../../contracts/driver-request/driver-request.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { RunRequestStub } from '../../../contracts/run-request/run-request.stub';
import { StepStub } from '../../../contracts/step/step.stub';
import { StopOnStub } from '../../../contracts/stop-on/stop-on.stub';
import { UrlPathStub } from '../../../contracts/url-path/url-path.stub';

import { driverHandleRequestBroker } from './driver-handle-request-broker';
import { driverHandleRequestBrokerProxy } from './driver-handle-request-broker.proxy';

// Never invoked on the ping/kill paths — a run is the only branch that reads any of these four.
const unusedFlushCursor = (): never => {
  throw new Error('ping/kill must never read the flush cursor');
};
const unusedAdvanceFlushCursor = (): never => {
  throw new Error('ping/kill must never advance the flush cursor');
};
const unusedLastShotPath = (): never => {
  throw new Error('ping/kill must never read the last shot path');
};
const unusedSetLastShotPath = (): never => {
  throw new Error('ping/kill must never set the last shot path');
};

describe('driverHandleRequestBroker', () => {
  describe('a ping request', () => {
    it('VALID: {kind: ping} => answers ok without touching the lane or minting a run id', async () => {
      driverHandleRequestBrokerProxy();
      const instanceId = InstanceIdStub();
      const lane = LaneSessionStub();

      const response = await driverHandleRequestBroker({
        request: DriverRequestStub({ kind: 'ping', payload: '' }),
        instanceId,
        lane,
        mintRunId: () => {
          throw new Error('ping must never mint a run id');
        },
        flushCursor: unusedFlushCursor,
        advanceFlushCursor: unusedAdvanceFlushCursor,
        lastShotPath: unusedLastShotPath,
        setLastShotPath: unusedSetLastShotPath,
      });

      expect(response).toStrictEqual({ ok: true, payload: '', error: null });
    });
  });

  describe('a run request', () => {
    it('VALID: {steps: one goto} => reaches the run executor and the response carries the run status', async () => {
      const proxy = driverHandleRequestBrokerProxy();
      const instanceId = InstanceIdStub();
      const runId = RunIdStub({ value: 'run_1' });
      proxy.stageRunSucceeds({ runId });
      const lane = proxy.laneForRun();
      const steps = [StepStub({ step: 'goto', path: UrlPathStub({ value: '/step-1' }) })];
      const payload = JSON.stringify(
        RunRequestStub({ instanceId, steps, stopOn: StopOnStub({ value: 'error' }) }),
      );

      const response = await driverHandleRequestBroker({
        request: DriverRequestStub({ kind: 'run', payload }),
        instanceId,
        lane,
        mintRunId: () => runId,
        flushCursor: proxy.flushCursor,
        advanceFlushCursor: proxy.advanceFlushCursor,
        lastShotPath: proxy.lastShotPath,
        setLastShotPath: proxy.setLastShotPath,
      });

      const decoded = proxy.decodeRunResult({ payload: response.payload });

      expect({
        ok: response.ok,
        error: response.error,
        runId: decoded.runId,
        status: decoded.status,
        stepsRun: decoded.stepsRun,
      }).toStrictEqual({
        ok: true,
        error: null,
        runId: 'run_1',
        status: 'done',
        stepsRun: 1,
      });
    });

    it('INVALID: {payload: not JSON} => ok is false and the payload stays empty', async () => {
      driverHandleRequestBrokerProxy();
      const instanceId = InstanceIdStub();
      const lane = LaneSessionStub();

      const response = await driverHandleRequestBroker({
        request: DriverRequestStub({ kind: 'run', payload: 'not-json' }),
        instanceId,
        lane,
        mintRunId: () => {
          throw new Error('a malformed payload must never mint a run id');
        },
        flushCursor: unusedFlushCursor,
        advanceFlushCursor: unusedAdvanceFlushCursor,
        lastShotPath: unusedLastShotPath,
        setLastShotPath: unusedSetLastShotPath,
      });

      expect({ ok: response.ok, payload: response.payload }).toStrictEqual({
        ok: false,
        payload: '',
      });
    });

    it('INVALID: {payload: not JSON} => the error names a malformed run payload', async () => {
      driverHandleRequestBrokerProxy();
      const instanceId = InstanceIdStub();
      const lane = LaneSessionStub();

      const response = await driverHandleRequestBroker({
        request: DriverRequestStub({ kind: 'run', payload: 'not-json' }),
        instanceId,
        lane,
        mintRunId: () => {
          throw new Error('a malformed payload must never mint a run id');
        },
        flushCursor: unusedFlushCursor,
        advanceFlushCursor: unusedAdvanceFlushCursor,
        lastShotPath: unusedLastShotPath,
        setLastShotPath: unusedSetLastShotPath,
      });

      expect(response.error).toMatch(/^Malformed run payload: .+$/su);
    });

    it('INVALID: {payload: valid JSON missing steps} => ok is false and the payload stays empty', async () => {
      driverHandleRequestBrokerProxy();
      const instanceId = InstanceIdStub();
      const lane = LaneSessionStub();

      const response = await driverHandleRequestBroker({
        request: DriverRequestStub({ kind: 'run', payload: '{"instanceId":"inst_dead"}' }),
        instanceId,
        lane,
        mintRunId: () => {
          throw new Error('a malformed payload must never mint a run id');
        },
        flushCursor: unusedFlushCursor,
        advanceFlushCursor: unusedAdvanceFlushCursor,
        lastShotPath: unusedLastShotPath,
        setLastShotPath: unusedSetLastShotPath,
      });

      expect({ ok: response.ok, payload: response.payload }).toStrictEqual({
        ok: false,
        payload: '',
      });
    });

    it('INVALID: {payload: valid JSON missing steps} => the error names a malformed run payload', async () => {
      driverHandleRequestBrokerProxy();
      const instanceId = InstanceIdStub();
      const lane = LaneSessionStub();

      const response = await driverHandleRequestBroker({
        request: DriverRequestStub({ kind: 'run', payload: '{"instanceId":"inst_dead"}' }),
        instanceId,
        lane,
        mintRunId: () => {
          throw new Error('a malformed payload must never mint a run id');
        },
        flushCursor: unusedFlushCursor,
        advanceFlushCursor: unusedAdvanceFlushCursor,
        lastShotPath: unusedLastShotPath,
        setLastShotPath: unusedSetLastShotPath,
      });

      expect(response.error).toMatch(/^Malformed run payload: .+$/su);
    });
  });

  describe('a kill request', () => {
    it('VALID: {kind: kill} => tears the lane down and answers with the kill result', async () => {
      const proxy = driverHandleRequestBrokerProxy();
      const instanceId = InstanceIdStub();
      const homePath = AbsoluteFilePathStub({ value: '/tmp/dm-siege-handle-request-kill-home' });
      const registryJson = JSON.stringify({
        instances: [RegistryEntryStub({ id: instanceId })],
      });
      proxy.stageKillSucceeds({ homePath, registryJson });
      const lane = proxy.laneForKill({ homePath });

      const response = await driverHandleRequestBroker({
        request: DriverRequestStub({ kind: 'kill', payload: '' }),
        instanceId,
        lane,
        mintRunId: () => {
          throw new Error('a kill request must never mint a run id');
        },
        flushCursor: unusedFlushCursor,
        advanceFlushCursor: unusedAdvanceFlushCursor,
        lastShotPath: unusedLastShotPath,
        setLastShotPath: unusedSetLastShotPath,
      });

      const decoded = proxy.decodeKillResult({ payload: response.payload });

      expect({
        ok: response.ok,
        error: response.error,
        instanceId: decoded.instanceId,
        stopped: decoded.stopped,
      }).toStrictEqual({
        ok: true,
        error: null,
        instanceId,
        stopped: true,
      });
    });

    it('VALID: {kind: kill} => marks the released registry row killed', async () => {
      const proxy = driverHandleRequestBrokerProxy();
      const instanceId = InstanceIdStub();
      const homePath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-handle-request-kill-registry-home',
      });
      const registryJson = JSON.stringify({
        instances: [RegistryEntryStub({ id: instanceId })],
      });
      proxy.stageKillSucceeds({ homePath, registryJson });
      const lane = proxy.laneForKill({ homePath });

      await driverHandleRequestBroker({
        request: DriverRequestStub({ kind: 'kill', payload: '' }),
        instanceId,
        lane,
        mintRunId: () => {
          throw new Error('a kill request must never mint a run id');
        },
        flushCursor: unusedFlushCursor,
        advanceFlushCursor: unusedAdvanceFlushCursor,
        lastShotPath: unusedLastShotPath,
        setLastShotPath: unusedSetLastShotPath,
      });

      const written = proxy.getReleasedRegistry();
      const releasedEntry = written.instances.find((entry) => entry.id === instanceId);

      expect(releasedEntry?.state).toBe('killed');
    });
  });
});
