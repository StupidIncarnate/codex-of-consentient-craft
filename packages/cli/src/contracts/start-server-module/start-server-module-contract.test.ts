import { startServerModuleContract } from './start-server-module-contract';
import { StartServerModuleStub } from './start-server-module.stub';

describe('startServerModuleContract', () => {
  it('VALID: {StartServer: a function} => parses and preserves the exact reference', () => {
    const startServer = (): void => undefined;

    const parsed = startServerModuleContract.parse({ StartServer: startServer });

    expect(parsed.StartServer).toBe(startServer);
  });

  it('VALID: {default stub} => parses with StartServer returning a success result', () => {
    const startServerModule = StartServerModuleStub();

    const result = startServerModule.StartServer();

    expect(result).toStrictEqual({ success: true });
  });

  it('INVALID: {missing StartServer} => throws', () => {
    expect(() => startServerModuleContract.parse({})).toThrow(/Expected a StartServer function/u);
  });

  it('INVALID: {StartServer: not a function} => throws', () => {
    expect(() => startServerModuleContract.parse({ StartServer: 'nope' })).toThrow(
      /Expected a StartServer function/u,
    );
  });

  it('VALID: {extra exports} => preserved via passthrough', () => {
    const parsed = startServerModuleContract.parse({
      StartServer: (): void => undefined,
      otherExport: 'value',
    });

    expect((parsed as { otherExport?: unknown }).otherExport).toBe('value');
  });
});
