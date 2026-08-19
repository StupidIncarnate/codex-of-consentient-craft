import { serverPackageJsonContract } from './server-package-json-contract';
import { ServerPackageJsonStub } from './server-package-json.stub';

describe('serverPackageJsonContract', () => {
  it('VALID: {version: "0.1.0"} => parses to the one-key object', () => {
    const packageJson = ServerPackageJsonStub({ version: '0.1.0' });

    expect(serverPackageJsonContract.parse(packageJson)).toStrictEqual({
      version: '0.1.0',
    });
  });

  it('VALID: {version: "1.2.3-beta.4"} => parses a prerelease', () => {
    const packageJson = ServerPackageJsonStub({ version: '1.2.3-beta.4' });

    expect(serverPackageJsonContract.parse(packageJson)).toStrictEqual({
      version: '1.2.3-beta.4',
    });
  });

  it('EDGE: {manifest carrying name/description/scripts} => result carries only version', () => {
    const result = serverPackageJsonContract.parse({
      name: '@dungeonmaster/server',
      version: '0.1.0',
      description: 'HTTP and WebSocket server for Dungeonmaster web UI',
      scripts: { build: 'tsc' },
    });

    expect(result).toStrictEqual({ version: '0.1.0' });
  });

  it('INVALID: {version: ""} => throws', () => {
    expect(() => {
      serverPackageJsonContract.parse({ version: '' });
    }).toThrow(/too_small/u);
  });

  it('INVALID: {} => throws', () => {
    expect(() => {
      serverPackageJsonContract.parse({});
    }).toThrow(/invalid_type/u);
  });

  it('INVALID: {version: 3} => throws', () => {
    expect(() => {
      serverPackageJsonContract.parse({ version: 3 as never });
    }).toThrow(/invalid_type/u);
  });
});
