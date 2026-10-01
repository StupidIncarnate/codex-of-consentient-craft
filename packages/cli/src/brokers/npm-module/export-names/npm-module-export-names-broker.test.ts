import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { GatewayNpmDependencyStub } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { npmModuleExportNamesBroker } from './npm-module-export-names-broker';
import { npmModuleExportNamesBrokerProxy } from './npm-module-export-names-broker.proxy';

describe('npmModuleExportNamesBroker', () => {
  it('VALID: {export = a function merged with a namespace} => lists namespace values and types apart', () => {
    npmModuleExportNamesBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-names-namespace' });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/package.json',
      content: JSON.stringify({ name: 'shaped-lib', version: '1.0.0', types: 'index.d.ts' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/index.d.ts',
      content: [
        'declare function pad(text: string): string;',
        'declare namespace pad {',
        '  const version: string;',
        '  function reset(): void;',
        '  class Padder {}',
        '  interface Options { fill: string }',
        '  type Width = number;',
        '  namespace Shapes { interface Box { width: Width } }',
        '}',
        'export = pad;',
        '',
      ].join('\n'),
    });
    const { name } = GatewayNpmDependencyStub({ name: 'shaped-lib', folder: 'shaped-lib' });

    const result = npmModuleExportNamesBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toStrictEqual({
      values: ['Padder', 'reset', 'version'],
      types: ['Options', 'Shapes', 'Width'],
    });
  });

  it('VALID: {export = a namespace with @deprecated members} => leaves the deprecated value and type out', () => {
    npmModuleExportNamesBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-names-deprecated' });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/package.json',
      content: JSON.stringify({ name: 'shaped-lib', version: '1.0.0', types: 'index.d.ts' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/index.d.ts',
      content: [
        'declare namespace lib {',
        '  const current: number;',
        '  /** @deprecated use current */',
        '  const legacy: number;',
        '  interface Options { fill: string }',
        '  /** @deprecated use Options */',
        '  interface OldOptions { fill: string }',
        '}',
        'export = lib;',
        '',
      ].join('\n'),
    });
    const { name } = GatewayNpmDependencyStub({ name: 'shaped-lib', folder: 'shaped-lib' });

    const result = npmModuleExportNamesBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toStrictEqual({ values: ['current'], types: ['Options'] });
  });

  it('VALID: {export = an object} => lists its identifier properties as values, skipping default and other keys', () => {
    npmModuleExportNamesBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-names-object' });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/package.json',
      content: JSON.stringify({ name: 'shaped-lib', version: '1.0.0', types: 'index.d.ts' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/index.d.ts',
      content:
        "declare const lib: { run(): void; level: number; default: string; 'not-an-identifier': boolean };\nexport = lib;\n",
    });
    const { name } = GatewayNpmDependencyStub({ name: 'shaped-lib', folder: 'shaped-lib' });

    const result = npmModuleExportNamesBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toStrictEqual({ values: ['level', 'run'], types: [] });
  });

  it('VALID: {a namespace member re-exported through export import} => follows the alias to its value', () => {
    npmModuleExportNamesBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-names-alias' });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/package.json',
      content: JSON.stringify({ name: 'shaped-lib', version: '1.0.0', types: 'index.d.ts' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/index.d.ts',
      content: [
        'declare namespace inner { const level: number; interface Shape { side: number } }',
        'declare namespace lib {',
        '  export import level = inner.level;',
        '  export import Shape = inner.Shape;',
        '}',
        'export = lib;',
        '',
      ].join('\n'),
    });
    const { name } = GatewayNpmDependencyStub({ name: 'shaped-lib', folder: 'shaped-lib' });

    const result = npmModuleExportNamesBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toStrictEqual({ values: ['level'], types: ['Shape'] });
  });

  it('EMPTY: {export = a bare function} => returns no names', () => {
    npmModuleExportNamesBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-names-function' });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/package.json',
      content: JSON.stringify({ name: 'shaped-lib', version: '1.0.0', types: 'index.d.ts' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/shaped-lib/index.d.ts',
      content: 'declare function pad(text: string): string;\nexport = pad;\n',
    });
    const { name } = GatewayNpmDependencyStub({ name: 'shaped-lib', folder: 'shaped-lib' });

    const result = npmModuleExportNamesBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toStrictEqual({ values: [], types: [] });
  });

  it('EMPTY: {packageName: not installed} => returns no names', () => {
    npmModuleExportNamesBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'export-names-missing' });
    const { name } = GatewayNpmDependencyStub({
      name: 'dungeonmaster-not-installed-anywhere',
      folder: 'dungeonmaster-not-installed-anywhere',
    });

    const result = npmModuleExportNamesBroker({ repoRoot: testbed.guildPath, packageName: name });
    testbed.cleanup();

    expect(result).toStrictEqual({ values: [], types: [] });
  });
});
