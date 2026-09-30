import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { resolve } from '#gateway/node/path';
import { npmModuleEsmOnlyBroker } from './npm-module-esm-only-broker';
import { npmModuleEsmOnlyBrokerProxy } from './npm-module-esm-only-broker.proxy';

// The monorepo root: its packages/@gateway/npm is a CommonJS package, like a consumer's.
const REPO_ROOT = resolve(__dirname, '../../../../../..');

describe('npmModuleEsmOnlyBroker', () => {
  it('VALID: {a "type": "module" package whose types resolve to ESM} => returns true', () => {
    npmModuleEsmOnlyBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'esm-only-module' });
    testbed.writeFile({
      relativePath: 'packages/@gateway/npm/package.json',
      content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/esm-lib/package.json',
      content: JSON.stringify({
        name: 'esm-lib',
        version: '1.0.0',
        type: 'module',
        exports: { '.': { types: './index.d.ts', default: './index.js' } },
      }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/esm-lib/index.d.ts',
      content: 'export declare const value: number;\n',
    });

    const result = npmModuleEsmOnlyBroker({ repoRoot: testbed.guildPath, specifier: 'esm-lib' });
    testbed.cleanup();

    expect(result).toBe(true);
  });

  it('VALID: {a CommonJS package} => returns false', () => {
    npmModuleEsmOnlyBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'esm-only-cjs' });
    testbed.writeFile({
      relativePath: 'packages/@gateway/npm/package.json',
      content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/cjs-lib/package.json',
      content: JSON.stringify({ name: 'cjs-lib', version: '1.0.0', types: 'index.d.ts' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/cjs-lib/index.d.ts',
      content: 'export declare const value: number;\n',
    });

    const result = npmModuleEsmOnlyBroker({ repoRoot: testbed.guildPath, specifier: 'cjs-lib' });
    testbed.cleanup();

    expect(result).toBe(false);
  });

  it('VALID: {elkjs, installed in this repo} => returns false', () => {
    npmModuleEsmOnlyBrokerProxy();

    expect(npmModuleEsmOnlyBroker({ repoRoot: REPO_ROOT, specifier: 'elkjs' })).toBe(false);
  });

  it('EMPTY: {a specifier that resolves nowhere} => returns false', () => {
    npmModuleEsmOnlyBrokerProxy();

    expect(
      npmModuleEsmOnlyBroker({
        repoRoot: REPO_ROOT,
        specifier: 'dungeonmaster-not-installed-anywhere',
      }),
    ).toBe(false);
  });
});
