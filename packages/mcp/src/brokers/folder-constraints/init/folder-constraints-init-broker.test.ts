import { folderConstraintsInitBroker } from './folder-constraints-init-broker';
import { folderConstraintsInitBrokerProxy } from './folder-constraints-init-broker.proxy';
import { FolderTypeStub } from '@questmaestro/shared/contracts';

describe('folderConstraintsInitBroker', () => {
  it('VALID: loads all 14 constraint markdown files and layer constraints from disk', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();

    // Should load all 14 constraint files
    expect(result.folderConstraints.size).toStrictEqual(14);

    // Should load layer constraints
    expect(result.layerConstraints).toBeDefined();
    expect(result.layerConstraints).toMatch(/LAYER FILES - Decomposing Complex Components/u);

    // Verify adapters constraints include translation boundary guidance
    const adaptersConstraints = result.folderConstraints.get(FolderTypeStub({ value: 'adapters' }));
    expect(adaptersConstraints).toBeDefined();
    expect(adaptersConstraints).toMatch(/TRANSLATION BOUNDARY:/u);

    // Verify brokers constraints include proxy pattern guidance
    const brokersConstraints = result.folderConstraints.get(FolderTypeStub({ value: 'brokers' }));
    expect(brokersConstraints).toBeDefined();
    expect(brokersConstraints).toMatch(/PROXY PATTERN:/u);

    // Verify guards constraints include object argument guidance
    const guardsConstraints = result.folderConstraints.get(FolderTypeStub({ value: 'guards' }));
    expect(guardsConstraints).toBeDefined();
    expect(guardsConstraints).toMatch(/OBJECT ARGUMENTS FOR STATICS:/u);

    // Verify contracts constraints include test import guidance
    const contractsConstraints = result.folderConstraints.get(
      FolderTypeStub({ value: 'contracts' }),
    );
    expect(contractsConstraints).toBeDefined();
    expect(contractsConstraints).toMatch(/CRITICAL - TEST IMPORTS:/u);

    // Verify statics constraints include critical rules guidance
    const staticsConstraints = result.folderConstraints.get(FolderTypeStub({ value: 'statics' }));
    expect(staticsConstraints).toBeDefined();
    expect(staticsConstraints).toMatch(/CRITICAL RULES:/u);
  });
});
