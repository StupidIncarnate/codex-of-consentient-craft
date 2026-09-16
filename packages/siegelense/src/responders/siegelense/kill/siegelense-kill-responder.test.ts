import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { KillResultStub } from '../../../contracts/kill-result/kill-result.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

import { SiegelenseKillResponder } from './siegelense-kill-responder';
import { SiegelenseKillResponderProxy } from './siegelense-kill-responder.proxy';

describe('SiegelenseKillResponder', () => {
  describe('a known, alive id', () => {
    it('VALID: {a known id} => writes the complete KillResult as one JSON document', async () => {
      const proxy = SiegelenseKillResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c1234' });
      const registry = RegistryStub({
        instances: [RegistryEntryStub({ id: instanceId, state: 'alive' })],
      });
      const killResult = KillResultStub({ instanceId });
      proxy.stageRegistry({ registry });
      proxy.stageKillResult({ result: killResult });

      await SiegelenseKillResponder({ instanceId });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(killResult, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('a known but already-dead id', () => {
    it('VALID: {a known but already-dead id} => the broker still runs, reaping orphans', async () => {
      const proxy = SiegelenseKillResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_dead1234' });
      const registry = RegistryStub({
        instances: [RegistryEntryStub({ id: instanceId, state: 'dead' })],
      });
      const killResult = KillResultStub({ instanceId, reapedPgids: [] });
      proxy.stageRegistry({ registry });
      proxy.stageKillResult({ result: killResult });

      await SiegelenseKillResponder({ instanceId });

      expect(proxy.getKillCallsMatching()).toStrictEqual([[{ instanceId }]]);
    });
  });

  describe('an id the registry never held', () => {
    it('ERROR: {an id the registry never held} => throws InstanceUnknownError and instanceKillBroker is never reached', async () => {
      const proxy = SiegelenseKillResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const registry = RegistryStub({ instances: [] });
      proxy.stageRegistry({ registry });

      await expect(SiegelenseKillResponder({ instanceId })).rejects.toStrictEqual(
        new InstanceUnknownError({ instanceId }),
      );
      expect(proxy.getKillCallsMatching()).toStrictEqual([]);
    });
  });

  describe('instanceKillBroker throws', () => {
    it('ERROR: {broker throws} => the error propagates unchanged and stdout stays empty', async () => {
      const proxy = SiegelenseKillResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c1234' });
      const registry = RegistryStub({
        instances: [RegistryEntryStub({ id: instanceId, state: 'alive' })],
      });
      const thrown = new Error('instanceKillBroker: driver connection refused');
      proxy.stageRegistry({ registry });
      proxy.stageKillThrows({ error: thrown });

      await expect(SiegelenseKillResponder({ instanceId })).rejects.toStrictEqual(thrown);
      expect(proxy.getStdoutWrites()).toStrictEqual([]);
    });
  });
});
