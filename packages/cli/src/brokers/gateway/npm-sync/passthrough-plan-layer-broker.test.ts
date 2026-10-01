import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { resolvePackageRoot } from '#gateway/node/module';
import { resolve } from '#gateway/node/path';
import { GatewayNpmDependencyStub } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { passthroughPlanLayerBroker } from './passthrough-plan-layer-broker';
import { passthroughPlanLayerBrokerProxy } from './passthrough-plan-layer-broker.proxy';

// This repo's own root, which has zod installed for real.
const THIS_REPO_ROOT = resolve(
  String(resolvePackageRoot({ specifier: '@dungeonmaster/npm/package.json' })),
  '../../..',
);

describe('passthroughPlanLayerBroker', () => {
  it('VALID: {a package not installed yet} => plans the root barrel, untyped', async () => {
    passthroughPlanLayerBrokerProxy();

    const result = await passthroughPlanLayerBroker({
      repoRoot: '/repo',
      ownSrcRoot: null,
      dependency: GatewayNpmDependencyStub({
        name: 'left-pad',
        range: '^1.3.0',
        folder: 'left-pad',
      }),
      excludedFolders: [],
    });

    expect(result).toStrictEqual([
      {
        dependency: { name: 'left-pad', range: '^1.3.0', folder: 'left-pad' },
        shape: 'untyped',
      },
    ]);
  });

  it('VALID: {an installed package whose root resolves} => plans the root barrel with its shape', async () => {
    passthroughPlanLayerBrokerProxy();

    const result = await passthroughPlanLayerBroker({
      repoRoot: THIS_REPO_ROOT,
      ownSrcRoot: null,
      dependency: GatewayNpmDependencyStub({ name: 'zod', range: '^4.0.0', folder: 'zod' }),
      excludedFolders: [],
    });

    expect(result).toStrictEqual([
      { dependency: { name: 'zod', range: '^4.0.0', folder: 'zod' }, shape: 'named-and-default' },
    ]);
  });

  it('VALID: {an installed export = package} => plans the root barrel with the names it re-exports', async () => {
    passthroughPlanLayerBrokerProxy();
    const testbed = installTestbedCreateBroker({ baseName: 'passthrough-plan-export-equals' });
    testbed.writeFile({
      relativePath: 'packages/@gateway/npm/package.json',
      content: JSON.stringify({ name: '@acme/npm', version: '0.1.0' }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/left-pad/package.json',
      content: JSON.stringify({
        name: 'left-pad',
        version: '1.3.0',
        main: 'index.js',
        types: 'index.d.ts',
      }),
    });
    testbed.writeFile({
      relativePath: 'node_modules/left-pad/index.js',
      content: "module.exports = (text) => text;\nmodule.exports.version = '1.3.0';\n",
    });
    testbed.writeFile({
      relativePath: 'node_modules/left-pad/index.d.ts',
      content:
        'declare function leftPad(text: string): string;\ndeclare namespace leftPad {\n  const version: string;\n  interface Options { fill: string }\n}\nexport = leftPad;\n',
    });

    const result = await passthroughPlanLayerBroker({
      repoRoot: testbed.guildPath,
      ownSrcRoot: null,
      dependency: GatewayNpmDependencyStub({
        name: 'left-pad',
        range: '^1.3.0',
        folder: 'left-pad',
      }),
      excludedFolders: [],
    });
    testbed.cleanup();

    expect(result).toStrictEqual([
      {
        dependency: { name: 'left-pad', range: '^1.3.0', folder: 'left-pad' },
        shape: 'export-equals',
        exportNames: { values: ['version'], types: ['Options'] },
      },
    ]);
  });
});
