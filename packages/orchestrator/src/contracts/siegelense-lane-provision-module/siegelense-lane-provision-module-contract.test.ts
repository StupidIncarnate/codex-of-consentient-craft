import { siegelenseLaneProvisionModuleContract } from './siegelense-lane-provision-module-contract';
import { SiegelenseLaneProvisionModuleStub } from './siegelense-lane-provision-module.stub';

describe('siegelenseLaneProvisionModuleContract', () => {
  it('VALID: {capacityReadBroker, instanceStartBroker: functions} => parses and preserves the exact references', () => {
    const capacityReadBroker = async () => Promise.resolve({ suggested: 1 });
    const instanceStartBroker = async () => Promise.resolve({});

    const parsed = siegelenseLaneProvisionModuleContract.parse({
      capacityReadBroker,
      instanceStartBroker,
    });

    expect(parsed).toStrictEqual({ capacityReadBroker, instanceStartBroker });
  });

  it('VALID: {default stub} => parses with capacityReadBroker resolving suggested: 1', async () => {
    const siegelenseModule = SiegelenseLaneProvisionModuleStub();

    const result = await siegelenseModule.capacityReadBroker({
      specName: 'default',
      poolSize: null,
    });

    expect(result).toStrictEqual({ suggested: 1 });
  });

  it('INVALID: {missing capacityReadBroker} => throws', () => {
    const instanceStartBroker = async () => Promise.resolve({});

    expect(() => siegelenseLaneProvisionModuleContract.parse({ instanceStartBroker })).toThrow(
      /Expected a capacityReadBroker function/u,
    );
  });

  it('INVALID: {missing instanceStartBroker} => throws', () => {
    const capacityReadBroker = async () => Promise.resolve({ suggested: 1 });

    expect(() => siegelenseLaneProvisionModuleContract.parse({ capacityReadBroker })).toThrow(
      /Expected an instanceStartBroker function/u,
    );
  });

  it('VALID: {extra exports} => preserved via passthrough', () => {
    const capacityReadBroker = async () => Promise.resolve({ suggested: 1 });
    const instanceStartBroker = async () => Promise.resolve({});

    const parsed = siegelenseLaneProvisionModuleContract.parse({
      capacityReadBroker,
      instanceStartBroker,
      otherExport: 'value',
    });

    expect((parsed as { otherExport?: unknown }).otherExport).toBe('value');
  });
});
