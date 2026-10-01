import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { resolve } from '#gateway/node/path';
import { GatewayNpmDependencyStub } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { npmModuleExportShapeBroker } from './npm-module-export-shape-broker';
import { npmModuleExportShapeBrokerProxy } from './npm-module-export-shape-broker.proxy';

// The monorepo root, whose node_modules holds every package these cases resolve for real.
const REPO_ROOT = resolve(__dirname, '../../../../../..');

describe('npmModuleExportShapeBroker', () => {
  it('VALID: {packageName: glob, named exports only} => returns named', () => {
    npmModuleExportShapeBrokerProxy();
    const { name } = GatewayNpmDependencyStub({ name: 'glob', folder: 'glob' });

    expect(npmModuleExportShapeBroker({ repoRoot: REPO_ROOT, packageName: name })).toBe('named');
  });

  it('VALID: {packageName: elkjs, a default export} => returns named-and-default', () => {
    npmModuleExportShapeBrokerProxy();
    const { name } = GatewayNpmDependencyStub({ name: 'elkjs', folder: 'elkjs' });

    expect(npmModuleExportShapeBroker({ repoRoot: REPO_ROOT, packageName: name })).toBe(
      'named-and-default',
    );
  });

  it('VALID: {packageName: typescript, export =} => returns export-equals', () => {
    npmModuleExportShapeBrokerProxy();
    const { name } = GatewayNpmDependencyStub({ name: 'typescript', folder: 'typescript' });

    expect(npmModuleExportShapeBroker({ repoRoot: REPO_ROOT, packageName: name })).toBe(
      'export-equals',
    );
  });

  it('VALID: {packageName: debug, types only in @types/debug} => returns export-equals', () => {
    npmModuleExportShapeBrokerProxy();
    const { name } = GatewayNpmDependencyStub({ name: 'debug', folder: 'debug' });

    expect(npmModuleExportShapeBroker({ repoRoot: REPO_ROOT, packageName: name })).toBe(
      'export-equals',
    );
  });

  it.each([
    [
      'export default function',
      'export declare const a: number;\nexport default function f(): void;\n',
    ],
    ['export { x as default }', 'declare const a: number;\nexport { a, a as default };\n'],
  ])('VALID: {declaration: %s} => returns named-and-default', (_label, declaration) => {
    npmModuleExportShapeBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-shape-default' });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/package.json',
      content: JSON.stringify({ name: 'shaped-lib', version: '1.0.0', types: 'index.d.ts' }),
    });
    testbed.writeFile({ relativePath: 'node_modules/shaped-lib/index.d.ts', content: declaration });
    const { name } = GatewayNpmDependencyStub({ name: 'shaped-lib', folder: 'shaped-lib' });

    const result = npmModuleExportShapeBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toBe('named-and-default');
  });

  it('VALID: {declarations export default, runtime module has no default key} => returns named', () => {
    npmModuleExportShapeBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-shape-runtime-no-default' });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/package.json',
      content: JSON.stringify({
        name: 'shaped-lib',
        version: '1.0.0',
        main: 'index.js',
        types: 'index.d.ts',
      }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/index.d.ts',
      content:
        'export declare const request: () => number;\ndeclare const lib: unknown;\nexport default lib;\n',
    });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/index.js',
      content: 'exports.request = () => 1;\n',
    });
    const { name } = GatewayNpmDependencyStub({ name: 'shaped-lib', folder: 'shaped-lib' });

    const result = npmModuleExportShapeBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toBe('named');
  });

  it('VALID: {declaration: an export list with no default} => returns named', () => {
    npmModuleExportShapeBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-shape-named' });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/package.json',
      content: JSON.stringify({ name: 'shaped-lib', version: '1.0.0', types: 'index.d.ts' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/index.d.ts',
      content: 'declare const a: number;\nexport { a };\nexport * from "./more";\n',
    });
    const { name } = GatewayNpmDependencyStub({ name: 'shaped-lib', folder: 'shaped-lib' });

    const result = npmModuleExportShapeBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toBe('named');
  });

  it('VALID: {an ESM-only package, typed with a default export} => returns esm-only', () => {
    npmModuleExportShapeBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-shape-esm' });
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
      content: 'declare const render: () => void;\nexport default render;\n',
    });
    const { name } = GatewayNpmDependencyStub({ name: 'esm-lib', folder: 'esm-lib' });

    const result = npmModuleExportShapeBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toBe('esm-only');
  });

  it('EDGE: {packageName: tsx, resolves to JavaScript only} => returns untyped', () => {
    npmModuleExportShapeBrokerProxy();
    const { name } = GatewayNpmDependencyStub({ name: 'tsx', folder: 'tsx' });

    expect(npmModuleExportShapeBroker({ repoRoot: REPO_ROOT, packageName: name })).toBe('untyped');
  });

  it('EMPTY: {packageName: not installed} => returns untyped', () => {
    npmModuleExportShapeBrokerProxy();
    const { name } = GatewayNpmDependencyStub({
      name: 'dungeonmaster-not-installed-anywhere',
      folder: 'dungeonmaster-not-installed-anywhere',
    });

    expect(npmModuleExportShapeBroker({ repoRoot: REPO_ROOT, packageName: name })).toBe('untyped');
  });
});
