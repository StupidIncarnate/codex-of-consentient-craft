import { gatewayTsconfigPathsSourceValuesTransformer } from './gateway-tsconfig-paths-source-values-transformer';

describe('gatewayTsconfigPathsSourceValuesTransformer', () => {
  it('VALID: {relativeToGatewayFolders: repo-root style, no leading dot} => prefixes every entry with ./', () => {
    const result = gatewayTsconfigPathsSourceValuesTransformer({
      relativeToGatewayFolders: {
        npm: 'packages/@gateway/npm',
        node: 'packages/@gateway/node',
        browser: 'packages/@gateway/browser',
        bin: 'packages/@gateway/bin',
      },
    });

    expect(result).toStrictEqual({
      '#gateway/npm/*': ['./packages/@gateway/npm/src/*/index.ts', './packages/@gateway/npm/src/*'],
      '#gateway/node/*': [
        './packages/@gateway/node/src/*/index.ts',
        './packages/@gateway/node/src/*',
      ],
      '#gateway/browser/*': [
        './packages/@gateway/browser/src/*/index.ts',
        './packages/@gateway/browser/src/*',
      ],
      '#gateway/bin/*': ['./packages/@gateway/bin/src/*/index.ts', './packages/@gateway/bin/src/*'],
    });
  });

  it('VALID: {relativeToGatewayFolders: already starts with ..} => leaves the leading .. untouched', () => {
    const result = gatewayTsconfigPathsSourceValuesTransformer({
      relativeToGatewayFolders: {
        npm: '../@gateway/npm',
        node: '../@gateway/node',
        browser: '../@gateway/browser',
        bin: '../@gateway/bin',
      },
    });

    expect(result).toStrictEqual({
      '#gateway/npm/*': ['../@gateway/npm/src/*/index.ts', '../@gateway/npm/src/*'],
      '#gateway/node/*': ['../@gateway/node/src/*/index.ts', '../@gateway/node/src/*'],
      '#gateway/browser/*': ['../@gateway/browser/src/*/index.ts', '../@gateway/browser/src/*'],
      '#gateway/bin/*': ['../@gateway/bin/src/*/index.ts', '../@gateway/bin/src/*'],
    });
  });
});
