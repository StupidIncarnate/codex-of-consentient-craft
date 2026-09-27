import { PathSegmentStub, GatewayImportsMapStub } from '@dungeonmaster/shared/contracts';
import { gatewayImportsMergeTransformer } from './gateway-imports-merge-transformer';

describe('gatewayImportsMergeTransformer', () => {
  it('EMPTY: {existingImports: undefined} => adds all four #gateway entries', () => {
    const result = gatewayImportsMergeTransformer({
      existingImports: undefined,
      scope: PathSegmentStub({ value: '@acme' }),
    });

    expect(result).toStrictEqual({
      '#gateway/npm/*': '@acme/npm/*',
      '#gateway/node/*': '@acme/node/*',
      '#gateway/browser/*': '@acme/browser/*',
      '#gateway/bin/*': '@acme/bin/*',
    });
  });

  it('VALID: {existingImports: one unrelated entry} => keeps it and adds the four #gateway entries', () => {
    const result = gatewayImportsMergeTransformer({
      existingImports: { '#alias/*': './src/*' },
      scope: PathSegmentStub({ value: '@acme' }),
    });

    expect(result).toStrictEqual({
      '#alias/*': './src/*',
      '#gateway/npm/*': '@acme/npm/*',
      '#gateway/node/*': '@acme/node/*',
      '#gateway/browser/*': '@acme/browser/*',
      '#gateway/bin/*': '@acme/bin/*',
    });
  });

  it('VALID: {existingImports: an already-different #gateway/npm/* value} => keeps the existing value instead of overwriting it', () => {
    const result = gatewayImportsMergeTransformer({
      existingImports: GatewayImportsMapStub({
        '#gateway/npm/*': '@someone-else/npm/*',
        '#gateway/node/*': '@acme/node/*',
        '#gateway/browser/*': '@acme/browser/*',
        '#gateway/bin/*': '@acme/bin/*',
      }),
      scope: PathSegmentStub({ value: '@acme' }),
    });

    expect(result).toStrictEqual({
      '#gateway/npm/*': '@someone-else/npm/*',
      '#gateway/node/*': '@acme/node/*',
      '#gateway/browser/*': '@acme/browser/*',
      '#gateway/bin/*': '@acme/bin/*',
    });
  });

  it('VALID: {existingImports: all four #gateway entries already present} => returns the same reference unchanged', () => {
    const existingImports = GatewayImportsMapStub({
      '#gateway/npm/*': '@acme/npm/*',
      '#gateway/node/*': '@acme/node/*',
      '#gateway/browser/*': '@acme/browser/*',
      '#gateway/bin/*': '@acme/bin/*',
    });

    const result = gatewayImportsMergeTransformer({
      existingImports,
      scope: PathSegmentStub({ value: '@acme' }),
    });

    expect(result).toBe(existingImports);
  });

  it('INVALID: {existingImports: a non-object value} => treats it as absent and adds all four #gateway entries', () => {
    const result = gatewayImportsMergeTransformer({
      existingImports: 'not-an-object',
      scope: PathSegmentStub({ value: '@acme' }),
    });

    expect(result).toStrictEqual({
      '#gateway/npm/*': '@acme/npm/*',
      '#gateway/node/*': '@acme/node/*',
      '#gateway/browser/*': '@acme/browser/*',
      '#gateway/bin/*': '@acme/bin/*',
    });
  });
});
