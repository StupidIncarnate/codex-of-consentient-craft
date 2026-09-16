import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { instanceRunBroker } from './instance-run-broker';
import { instanceRunBrokerProxy } from './instance-run-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import { StepStub } from '../../../contracts/step/step.stub';
import { StopOnStub } from '../../../contracts/stop-on/stop-on.stub';
import { DriverUnreachableError } from '../../../errors/driver-unreachable/driver-unreachable-error';

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
});
