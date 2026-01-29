import { e2eTestbedCreateBroker } from './e2e-testbed-create-broker';
import { e2eTestbedCreateBrokerProxy } from './e2e-testbed-create-broker.proxy';
import { BaseNameStub } from '../../../contracts/base-name/base-name.stub';

describe('e2eTestbedCreateBroker', () => {
  it('VALID: {baseName} => creates testbed with project path containing baseName', () => {
    e2eTestbedCreateBrokerProxy();
    const baseName = BaseNameStub({ value: 'e2e-broker-test' });

    const testbed = e2eTestbedCreateBroker({ baseName });
    const containsBaseName = testbed.projectPath.includes('e2e-broker-test');
    testbed.cleanup();

    expect(containsBaseName).toBe(true);
  });

  it('VALID: {baseName} => testbed has startCli method', () => {
    e2eTestbedCreateBrokerProxy();
    const baseName = BaseNameStub({ value: 'e2e-methods-test' });

    const testbed = e2eTestbedCreateBroker({ baseName });
    const hasStartCli = typeof testbed.startCli === 'function';
    testbed.cleanup();

    expect(hasStartCli).toBe(true);
  });

  it('VALID: {no quests} => getQuestFiles returns empty array', () => {
    e2eTestbedCreateBrokerProxy();
    const baseName = BaseNameStub({ value: 'e2e-no-quests-test' });

    const testbed = e2eTestbedCreateBroker({ baseName });
    const quests = testbed.getQuestFiles();
    testbed.cleanup();

    expect(quests).toStrictEqual([]);
  });

  it('VALID: {before startCli} => getScreen returns menu as screen name', () => {
    e2eTestbedCreateBrokerProxy();
    const baseName = BaseNameStub({ value: 'e2e-getscreen-name-test' });

    const testbed = e2eTestbedCreateBroker({ baseName });
    const screenName = testbed.getScreen().name;
    testbed.cleanup();

    expect(screenName).toBe('menu');
  });

  it('VALID: {before startCli} => getScreen returns empty frame', () => {
    e2eTestbedCreateBrokerProxy();
    const baseName = BaseNameStub({ value: 'e2e-getscreen-frame-test' });

    const testbed = e2eTestbedCreateBroker({ baseName });
    const screenFrame = testbed.getScreen().frame;
    testbed.cleanup();

    expect(screenFrame).toBe('');
  });
});
