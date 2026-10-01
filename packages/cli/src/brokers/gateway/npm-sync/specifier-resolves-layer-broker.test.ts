import { resolvePackageRoot } from '#gateway/node/module';
import { resolve } from '#gateway/node/path';
import { specifierResolvesLayerBroker } from './specifier-resolves-layer-broker';
import { specifierResolvesLayerBrokerProxy } from './specifier-resolves-layer-broker.proxy';

// This repo's own root, which has zod and @modelcontextprotocol/sdk installed for real.
const THIS_REPO_ROOT = resolve(
  String(resolvePackageRoot({ specifier: '@dungeonmaster/npm/package.json' })),
  '../../..',
);

describe('specifierResolvesLayerBroker', () => {
  it('VALID: {an installed package root} => returns true', () => {
    specifierResolvesLayerBrokerProxy();

    expect(specifierResolvesLayerBroker({ repoRoot: THIS_REPO_ROOT, specifier: 'zod' })).toBe(true);
  });

  it('VALID: {an exported subpath} => returns true', () => {
    specifierResolvesLayerBrokerProxy();

    expect(
      specifierResolvesLayerBroker({
        repoRoot: THIS_REPO_ROOT,
        specifier: '@modelcontextprotocol/sdk/server/mcp.js',
      }),
    ).toBe(true);
  });

  it('INVALID: {a package nobody installed} => returns false', () => {
    specifierResolvesLayerBrokerProxy();

    expect(
      specifierResolvesLayerBroker({ repoRoot: '/repo', specifier: 'left-pad-not-installed' }),
    ).toBe(false);
  });

  it('INVALID: {a subpath the package does not export} => returns false', () => {
    specifierResolvesLayerBrokerProxy();

    expect(
      specifierResolvesLayerBroker({
        repoRoot: THIS_REPO_ROOT,
        specifier: '@modelcontextprotocol/sdk/not-a-real-subpath',
      }),
    ).toBe(false);
  });
});
