import { gatewayTsconfigPathsDeclarationValuesTransformer } from './gateway-tsconfig-paths-declaration-values-transformer';

describe('gatewayTsconfigPathsDeclarationValuesTransformer', () => {
  it('VALID: {relativeToGatewayFolders: sibling-package style} => returns one dist/*/index.d.ts candidate per folder', () => {
    const result = gatewayTsconfigPathsDeclarationValuesTransformer({
      relativeToGatewayFolders: {
        npm: '../@gateway/npm',
        node: '../@gateway/node',
        browser: '../@gateway/browser',
        bin: '../@gateway/bin',
      },
    });

    expect(result).toStrictEqual({
      '#gateway/npm/*': ['../@gateway/npm/dist/*/index.d.ts'],
      '#gateway/node/*': ['../@gateway/node/dist/*/index.d.ts'],
      '#gateway/browser/*': ['../@gateway/browser/dist/*/index.d.ts'],
      '#gateway/bin/*': ['../@gateway/bin/dist/*/index.d.ts'],
    });
  });

  it('VALID: {relativeToGatewayFolders: no leading dot} => prefixes every entry with ./', () => {
    const result = gatewayTsconfigPathsDeclarationValuesTransformer({
      relativeToGatewayFolders: {
        npm: 'packages/@gateway/npm',
        node: 'packages/@gateway/node',
        browser: 'packages/@gateway/browser',
        bin: 'packages/@gateway/bin',
      },
    });

    expect(result).toStrictEqual({
      '#gateway/npm/*': ['./packages/@gateway/npm/dist/*/index.d.ts'],
      '#gateway/node/*': ['./packages/@gateway/node/dist/*/index.d.ts'],
      '#gateway/browser/*': ['./packages/@gateway/browser/dist/*/index.d.ts'],
      '#gateway/bin/*': ['./packages/@gateway/bin/dist/*/index.d.ts'],
    });
  });
});
