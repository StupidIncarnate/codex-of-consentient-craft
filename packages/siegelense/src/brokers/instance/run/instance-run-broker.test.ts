import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { instanceRunBroker } from './instance-run-broker';
import { instanceRunBrokerProxy } from './instance-run-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import { StepStub } from '../../../contracts/step/step.stub';
import { StoppedAtStub } from '../../../contracts/stopped-at/stopped-at.stub';
import { StopOnStub } from '../../../contracts/stop-on/stop-on.stub';
import { DriverUnreachableError } from '../../../errors/driver-unreachable/driver-unreachable-error';
import { InstanceUnusableError } from '../../../errors/instance-unusable/instance-unusable-error';

const INSTANCE_ID = InstanceIdStub({ value: 'inst_7f3a9c21' });
const SOCKET_PATH_VALUE = `/tmp/dm-siege-sockets/${INSTANCE_ID}.sock`;
const SOCKET_PATH = AbsoluteFilePathStub({ value: SOCKET_PATH_VALUE });

describe('instanceRunBroker', () => {
  describe('driver answers', () => {
    it('VALID: {run} => sends one run request and returns the parsed RunResult', async () => {
      const proxy = instanceRunBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

      const steps = [StepStub()];
      const stopOn = StopOnStub();
      const expectedResult = RunResultStub({ instanceId: INSTANCE_ID });
      proxy.setupDriverAnswers({ socketPath: SOCKET_PATH, runResult: expectedResult });

      const result = await instanceRunBroker({ instanceId: INSTANCE_ID, steps, stopOn });

      expect(result).toStrictEqual(expectedResult);

      const written = proxy.getRunRequestWritten({ socketPath: SOCKET_PATH });

      expect(JSON.parse(String(written).trimEnd())).toStrictEqual({
        kind: 'run',
        payload: JSON.stringify({ instanceId: INSTANCE_ID, steps, stopOn }),
      });
    });
  });

  describe('driver reports its own failure', () => {
    it('ERROR: {driver answers ok false} => throws naming the driver-reported error', async () => {
      const proxy = instanceRunBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverReportsFailure({
        socketPath: SOCKET_PATH,
        errorMessage: 'malformed run request',
      });

      await expect(
        instanceRunBroker({ instanceId: INSTANCE_ID, steps: [StepStub()], stopOn: StopOnStub() }),
      ).rejects.toThrow(/malformed run request/u);
    });
  });

  describe('driver unreachable', () => {
    it('ERROR: {socket refused} => throws DriverUnreachableError naming the instance', async () => {
      const proxy = instanceRunBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachable({ socketPath: SOCKET_PATH });

      await expect(
        instanceRunBroker({ instanceId: INSTANCE_ID, steps: [StepStub()], stopOn: StopOnStub() }),
      ).rejects.toStrictEqual(
        new DriverUnreachableError({
          instanceId: INSTANCE_ID,
          socketPath: SOCKET_PATH_VALUE,
          cause: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
        }),
      );
    });
  });

  describe('registry already marks this instance unusable', () => {
    it('ERROR: {registry row state: unusable} => throws InstanceUnusableError before touching the socket', async () => {
      const proxy = instanceRunBrokerProxy();
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: SOCKET_PATH,
        state: 'unusable',
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

      await expect(
        instanceRunBroker({ instanceId: INSTANCE_ID, steps: [StepStub()], stopOn: StopOnStub() }),
      ).rejects.toStrictEqual(new InstanceUnusableError({ instanceId: INSTANCE_ID }));

      // No socket call was ever attempted — the driver proxy was never staged an answer, so a
      // real attempt would have thrown an unconfigured-mock error rather than the assertion above.
    });
  });

  describe('a mid-batch seed failure marks the instance unusable', () => {
    it('VALID: {RunResult stoppedAt.verb: seed} => writes state: unusable for this instance only', async () => {
      const proxy = instanceRunBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH, state: 'alive' });
      const bystanderId = InstanceIdStub({ value: 'inst_00000000' });
      const bystander = RegistryEntryStub({ id: bystanderId, state: 'alive' });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [bystander, entry] }) });

      const seedFailureResult = RunResultStub({
        instanceId: INSTANCE_ID,
        status: 'failed',
        stoppedAt: StoppedAtStub({ verb: 'seed' }),
      });
      proxy.setupDriverAnswers({ socketPath: SOCKET_PATH, runResult: seedFailureResult });

      const result = await instanceRunBroker({
        instanceId: INSTANCE_ID,
        steps: [StepStub()],
        stopOn: StopOnStub(),
      });

      expect(result).toStrictEqual(seedFailureResult);
      expect(proxy.getWrittenRegistry()).toStrictEqual(
        RegistryStub({
          instances: [bystander, RegistryEntryStub({ ...entry, state: 'unusable' })],
        }),
      );
    });
  });

  describe('a non-seed step failure does not mark the instance', () => {
    it('VALID: {RunResult stoppedAt.verb: click} => no registry write happens', async () => {
      const proxy = instanceRunBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH, state: 'alive' });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

      const clickFailureResult = RunResultStub({
        instanceId: INSTANCE_ID,
        status: 'failed',
        stoppedAt: StoppedAtStub({ verb: 'click' }),
      });
      proxy.setupDriverAnswers({ socketPath: SOCKET_PATH, runResult: clickFailureResult });

      const result = await instanceRunBroker({
        instanceId: INSTANCE_ID,
        steps: [StepStub()],
        stopOn: StopOnStub(),
      });

      expect(result).toStrictEqual(clickFailureResult);
      expect(proxy.getWrittenRegistry()).toBe(undefined);
    });
  });

  describe('a done run does not mark the instance', () => {
    it('VALID: {RunResult stoppedAt: null} => no registry write happens', async () => {
      const proxy = instanceRunBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH, state: 'alive' });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

      const doneResult = RunResultStub({
        instanceId: INSTANCE_ID,
        status: 'done',
        stoppedAt: null,
      });
      proxy.setupDriverAnswers({ socketPath: SOCKET_PATH, runResult: doneResult });

      const result = await instanceRunBroker({
        instanceId: INSTANCE_ID,
        steps: [StepStub()],
        stopOn: StopOnStub(),
      });

      expect(result).toStrictEqual(doneResult);
      expect(proxy.getWrittenRegistry()).toBe(undefined);
    });
  });
});
