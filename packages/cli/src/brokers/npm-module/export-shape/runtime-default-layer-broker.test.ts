import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { resolve } from '#gateway/node/path';
import { GatewayNpmDependencyStub } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { runtimeDefaultLayerBroker } from './runtime-default-layer-broker';
import { runtimeDefaultLayerBrokerProxy } from './runtime-default-layer-broker.proxy';

// The monorepo root, whose node_modules holds the real packages these cases load.
const REPO_ROOT = resolve(__dirname, '../../../../../..');

describe('runtimeDefaultLayerBroker', () => {
  it('VALID: {elkjs, whose CommonJS module sets default} => returns true', () => {
    runtimeDefaultLayerBrokerProxy();
    const { name } = GatewayNpmDependencyStub({ name: 'elkjs', folder: 'elkjs' });

    expect(runtimeDefaultLayerBroker({ repoRoot: REPO_ROOT, packageName: name })).toBe(true);
  });

  it('VALID: {a module with no own default key} => returns false', () => {
    runtimeDefaultLayerBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'runtime-default-none' });
    testbed.writeFile({
      relativePath: 'node_modules/no-default-lib/package.json',
      content: JSON.stringify({ name: 'no-default-lib', version: '1.0.0', main: 'index.js' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/no-default-lib/index.js',
      content: 'exports.request = () => 1;\n',
    });
    const { name } = GatewayNpmDependencyStub({ name: 'no-default-lib', folder: 'no-default-lib' });

    const result = runtimeDefaultLayerBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toBe(false);
  });

  it('EDGE: {a module that exports a plain string} => returns false', () => {
    runtimeDefaultLayerBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'runtime-default-string' });
    testbed.writeFile({
      relativePath: 'node_modules/string-lib/package.json',
      content: JSON.stringify({ name: 'string-lib', version: '1.0.0', main: 'index.js' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/string-lib/index.js',
      content: "module.exports = 'just text';\n",
    });
    const { name } = GatewayNpmDependencyStub({ name: 'string-lib', folder: 'string-lib' });

    const result = runtimeDefaultLayerBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toBe(false);
  });

  it('EDGE: {a module that throws while loading} => returns null', () => {
    runtimeDefaultLayerBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'runtime-default-throws' });
    testbed.writeFile({
      relativePath: 'node_modules/broken-lib/package.json',
      content: JSON.stringify({ name: 'broken-lib', version: '1.0.0', main: 'index.js' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/broken-lib/index.js',
      content: "throw new Error('peer missing');\n",
    });
    const { name } = GatewayNpmDependencyStub({ name: 'broken-lib', folder: 'broken-lib' });

    const result = runtimeDefaultLayerBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toBe(null);
  });
});
