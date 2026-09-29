import { folderConstraintsInitBroker } from './folder-constraints-init-broker';
import { folderConstraintsInitBrokerProxy } from './folder-constraints-init-broker.proxy';
import { folderConstraintsStatics } from '../../../statics/folder-constraints/folder-constraints-statics';

describe('folderConstraintsInitBroker', () => {
  it('VALID: loads one constraint markdown file per folder type that has one', async () => {
    folderConstraintsInitBrokerProxy();

    const { folderConstraints } = await folderConstraintsInitBroker();

    expect(folderConstraints.size).toBe(Object.keys(folderConstraintsStatics).length);
  });

  it('VALID: brokers constraints include proxy pattern guidance', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();
    const brokersConstraints = result.folderConstraints.get('brokers');

    expect(brokersConstraints).toMatch(/^\*\*PROXY PATTERN:\*\*$/mu);
  });

  it('VALID: guards constraints include object argument guidance', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();
    const guardsConstraints = result.folderConstraints.get('guards');

    expect(guardsConstraints).toMatch(/^\*\*OBJECT ARGUMENTS FOR STATICS:\*\*$/mu);
  });

  it('VALID: contracts constraints include test import guidance', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();
    const contractsConstraints = result.folderConstraints.get('contracts');

    expect(contractsConstraints).toMatch(/^\*\*CRITICAL - TEST IMPORTS:\*\*$/mu);
  });

  it('VALID: statics constraints include critical rules guidance', async () => {
    folderConstraintsInitBrokerProxy();

    const result = await folderConstraintsInitBroker();
    const staticsConstraints = result.folderConstraints.get('statics');

    expect(staticsConstraints).toMatch(/^\*\*CRITICAL RULES:\*\*$/mu);
  });
});
