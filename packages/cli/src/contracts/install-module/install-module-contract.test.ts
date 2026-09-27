import { InstallContextStub } from '@dungeonmaster/shared/contracts';
import { installModuleContract } from './install-module-contract';
import { InstallModuleStub } from './install-module.stub';

describe('installModuleContract', () => {
  it('VALID: {StartInstall: a function} => parses and preserves the exact reference', () => {
    const startInstall = (): void => undefined;

    const parsed = installModuleContract.parse({ StartInstall: startInstall });

    expect(parsed.StartInstall).toBe(startInstall);
  });

  it('VALID: {default stub} => parses with StartInstall callable', async () => {
    const installModule = InstallModuleStub();
    const context = InstallContextStub({
      value: { targetProjectRoot: '/project', dungeonmasterRoot: '/dm' },
    });

    const result = await installModule.StartInstall({ context });

    expect(result.success).toBe(true);
  });

  it('INVALID: {missing StartInstall} => throws', () => {
    expect(() => installModuleContract.parse({})).toThrow(/Expected a StartInstall function/u);
  });

  it('INVALID: {StartInstall: not a function} => throws', () => {
    expect(() => installModuleContract.parse({ StartInstall: 'nope' })).toThrow(
      /Expected a StartInstall function/u,
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
