import { folderConstraintsInitBroker } from './folder-constraints-init-broker';
import { folderConstraintsInitBrokerProxy } from './folder-constraints-init-broker.proxy';
import { FolderTypeStub } from '@questmaestro/shared/contracts';

describe('folderConstraintsInitBroker', () => {
  it('VALID: loads all 14 constraint markdown files from disk', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();

    expect(result.folderConstraints.size).toBe(14);
    expect(result.layerConstraints).toBeDefined();
    expect(result.layerConstraints).toMatch(/LAYER FILES - Decomposing Complex Components/u);
  });

  it('VALID: adapters constraints include translation boundary guidance', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();
    const adaptersConstraints = result.folderConstraints.get(FolderTypeStub({ value: 'adapters' }));

    expect(adaptersConstraints).toBeDefined();
    expect(adaptersConstraints).toMatch(/TRANSLATION BOUNDARY:/u);
  });

  it('VALID: brokers constraints include proxy pattern guidance', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();
    const brokersConstraints = result.folderConstraints.get(FolderTypeStub({ value: 'brokers' }));

    expect(brokersConstraints).toBeDefined();
    expect(brokersConstraints).toMatch(/PROXY PATTERN:/u);
  });

  it('VALID: guards constraints include object argument guidance', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();
    const guardsConstraints = result.folderConstraints.get(FolderTypeStub({ value: 'guards' }));

    expect(guardsConstraints).toBeDefined();
    expect(guardsConstraints).toMatch(/OBJECT ARGUMENTS FOR STATICS:/u);
  });

  it('VALID: contracts constraints include test import guidance', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();
    const contractsConstraints = result.folderConstraints.get(
      FolderTypeStub({ value: 'contracts' }),
    );

    expect(contractsConstraints).toBeDefined();
    expect(contractsConstraints).toMatch(/CRITICAL - TEST IMPORTS:/u);
  });

  it('VALID: statics constraints include critical rules guidance', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();
    const staticsConstraints = result.folderConstraints.get(FolderTypeStub({ value: 'statics' }));

    expect(staticsConstraints).toBeDefined();
    expect(staticsConstraints).toMatch(/CRITICAL RULES:/u);
  });
});
