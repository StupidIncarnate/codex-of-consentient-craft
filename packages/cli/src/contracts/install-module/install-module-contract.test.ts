import { InstallContextStub, InstallResultStub } from '@dungeonmaster/shared/contracts';
import { installModuleContract } from './install-module-contract';
import { InstallModuleStub } from './install-module.stub';

describe('installModuleContract', () => {
  it('VALID: {StartInstall: a function} => parses and preserves the exact reference', () => {
    const startInstall = (): void => undefined;

    const parsed = installModuleContract.parse({ StartInstall: startInstall });

    expect(parsed.StartInstall).toBe(startInstall);
  });

  it('VALID: {StartInstallFinalize: a function} => parses and preserves the exact reference', () => {
    const startInstallFinalize = (): void => undefined;

    const parsed = installModuleContract.parse({ StartInstallFinalize: startInstallFinalize });

    expect(parsed.StartInstallFinalize).toBe(startInstallFinalize);
  });

  it('VALID: {default stub} => parses with a callable StartInstall and no StartInstallFinalize', async () => {
    const installModule = InstallModuleStub();
    const context = InstallContextStub({
      value: { targetProjectRoot: '/project', dungeonmasterRoot: '/dm' },
    });

    const result = await installModule.StartInstall?.({ context });

    expect({ result, finalize: installModule.StartInstallFinalize }).toStrictEqual({
      result: InstallResultStub({
        value: { packageName: '@dungeonmaster/cli', success: true, action: 'created' },
      }),
      finalize: undefined,
    });
  });

  it('EMPTY: {} => parses with neither export', () => {
    expect(installModuleContract.parse({})).toStrictEqual({});
  });

  it('INVALID: {StartInstall: not a function} => throws', () => {
    expect(() => installModuleContract.parse({ StartInstall: 'nope' })).toThrow(
      /Expected a StartInstall function/u,
    );
  });

  it('INVALID: {StartInstallFinalize: not a function} => throws', () => {
    expect(() => installModuleContract.parse({ StartInstallFinalize: 'nope' })).toThrow(
      /Expected a StartInstallFinalize function/u,
    );
  });

  it('VALID: {extra exports} => preserved via passthrough', () => {
    const parsed = installModuleContract.parse({
      StartInstall: (): void => undefined,
      otherExport: 'value',
    });

    expect((parsed as { otherExport?: unknown }).otherExport).toBe('value');
  });
});
