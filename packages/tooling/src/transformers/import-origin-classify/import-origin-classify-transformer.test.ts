import { importOriginClassifyTransformer } from './import-origin-classify-transformer';

describe('importOriginClassifyTransformer', () => {
  it.each([
    ['#gateway/node/fs__promises', 'gateway'],
    ['./x/x-adapter', 'repo'],
    ['../contracts/thing/thing-contract', 'repo'],
    ['#internal/thing', 'repo'],
    ['@acme/shared/contracts', 'repo'],
    ['plain-workspace', 'repo'],
    ['plain-workspace/contracts', 'repo'],
    ['fs/promises', 'outside'],
    ['node:fs', 'outside'],
    ['zod', 'outside'],
    ['@other/pkg', 'outside'],
    ['plain-workspace-lookalike', 'outside'],
  ])('VALID: {specifier: %s} => %s', (specifier, expected) => {
    const result = importOriginClassifyTransformer({
      specifier,
      workspaceScope: '@acme',
      workspacePackageNames: ['plain-workspace'],
    });

    expect(result).toBe(expected);
  });

  it('EMPTY: {workspaceScope: null} => a scoped specifier is outside unless a package name matches', () => {
    const result = importOriginClassifyTransformer({
      specifier: '@acme/shared/contracts',
      workspaceScope: null,
      workspacePackageNames: [],
    });

    expect(result).toBe('outside');
  });
});
