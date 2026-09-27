import { siegelenseModuleContract } from './siegelense-module-contract';
import { SiegelenseModuleStub } from './siegelense-module.stub';

describe('siegelenseModuleContract', () => {
  it('VALID: {StartSiegelense: a function} => parses and preserves the exact reference', () => {
    const startSiegelense = async (): Promise<void> => Promise.resolve(undefined);

    const parsed = siegelenseModuleContract.parse({ StartSiegelense: startSiegelense });

    expect(parsed.StartSiegelense).toBe(startSiegelense);
  });

  it('VALID: {default stub} => parses with StartSiegelense resolving a success result', async () => {
    const siegelenseModule = SiegelenseModuleStub();

    const result = await siegelenseModule.StartSiegelense({ args: [] });

    expect(result).toStrictEqual({ success: true });
  });

  it('INVALID: {missing StartSiegelense} => throws', () => {
    expect(() => siegelenseModuleContract.parse({})).toThrow(
      /Expected a StartSiegelense function/u,
    );
  });

  it('INVALID: {StartSiegelense: not a function} => throws', () => {
    expect(() => siegelenseModuleContract.parse({ StartSiegelense: 'nope' })).toThrow(
      /Expected a StartSiegelense function/u,
    );
  });

  it('VALID: {extra exports} => preserved via passthrough', () => {
    const parsed = siegelenseModuleContract.parse({
      StartSiegelense: async (): Promise<void> => Promise.resolve(undefined),
      otherExport: 'value',
    });

    expect((parsed as { otherExport?: unknown }).otherExport).toBe('value');
  });
});
