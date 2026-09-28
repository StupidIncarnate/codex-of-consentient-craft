import { siegelenseInstanceKillModuleContract } from './siegelense-instance-kill-module-contract';
import { SiegelenseInstanceKillModuleStub } from './siegelense-instance-kill-module.stub';

describe('siegelenseInstanceKillModuleContract', () => {
  it('VALID: {instanceKillBroker: a function} => parses and preserves the exact reference', () => {
    const instanceKillBroker = async (): Promise<{ stopped: boolean }> =>
      Promise.resolve({ stopped: true });

    const parsed = siegelenseInstanceKillModuleContract.parse({ instanceKillBroker });

    expect(parsed.instanceKillBroker).toBe(instanceKillBroker);
  });

  it('VALID: {default stub} => parses with instanceKillBroker resolving stopped: true', async () => {
    const siegelenseModule = SiegelenseInstanceKillModuleStub();

    const result = await siegelenseModule.instanceKillBroker({ instanceId: 'inst_7f3a9c21' });

    expect(result).toStrictEqual({ stopped: true });
  });

  it('INVALID: {missing instanceKillBroker} => throws', () => {
    expect(() => siegelenseInstanceKillModuleContract.parse({})).toThrow(
      /Expected an instanceKillBroker function/u,
    );
  });

  it('INVALID: {instanceKillBroker: not a function} => throws', () => {
    expect(() =>
      siegelenseInstanceKillModuleContract.parse({ instanceKillBroker: 'nope' }),
    ).toThrow(/Expected an instanceKillBroker function/u);
  });

  it('VALID: {extra exports} => preserved via passthrough', () => {
    const parsed = siegelenseInstanceKillModuleContract.parse({
      instanceKillBroker: async (): Promise<{ stopped: boolean }> =>
        Promise.resolve({ stopped: true }),
      otherExport: 'value',
    });

    expect((parsed as { otherExport?: unknown }).otherExport).toBe('value');
  });
});
