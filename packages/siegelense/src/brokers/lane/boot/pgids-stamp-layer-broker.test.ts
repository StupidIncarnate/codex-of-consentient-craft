import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { pgidsStampLayerBroker } from './pgids-stamp-layer-broker';
import { pgidsStampLayerBrokerProxy } from './pgids-stamp-layer-broker.proxy';

describe('pgidsStampLayerBroker', () => {
  it('VALID: {this instance and another in the registry} => rewrites only this row, and only its pgids', async () => {
    const proxy = pgidsStampLayerBrokerProxy();
    const instanceId = InstanceIdStub({ value: 'inst_11111111' });
    const own = RegistryEntryStub({
      id: instanceId,
      pgids: [ProcessGroupIdStub({ value: 1_001 })],
    });
    const other = RegistryEntryStub({
      id: InstanceIdStub({ value: 'inst_22222222' }),
      pgids: [ProcessGroupIdStub({ value: 3_001 })],
    });
    proxy.setupRegistry({ json: JSON.stringify(RegistryStub({ instances: [own, other] })) });

    const result = await pgidsStampLayerBroker({
      instanceId,
      pgids: [ProcessGroupIdStub({ value: 2_001 }), ProcessGroupIdStub({ value: 2_002 })],
    });

    const expected = RegistryStub({
      instances: [
        RegistryEntryStub({
          id: instanceId,
          pgids: [ProcessGroupIdStub({ value: 2_001 }), ProcessGroupIdStub({ value: 2_002 })],
        }),
        other,
      ],
    });

    expect({ result, written: proxy.getWrittenContent() }).toStrictEqual({
      result: expected,
      written: `${JSON.stringify(expected)}\n`,
    });
  });

  it('EDGE: {instance not in the registry} => writes the registry back unchanged', async () => {
    const proxy = pgidsStampLayerBrokerProxy();
    const other = RegistryEntryStub({ id: InstanceIdStub({ value: 'inst_22222222' }) });
    proxy.setupRegistry({ json: JSON.stringify(RegistryStub({ instances: [other] })) });

    const result = await pgidsStampLayerBroker({
      instanceId: InstanceIdStub({ value: 'inst_11111111' }),
      pgids: [ProcessGroupIdStub({ value: 2_001 })],
    });

    expect(result).toStrictEqual(RegistryStub({ instances: [other] }));
  });
});
