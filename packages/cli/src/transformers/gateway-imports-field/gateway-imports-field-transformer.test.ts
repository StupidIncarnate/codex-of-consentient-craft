import { PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { gatewayImportsFieldTransformer } from './gateway-imports-field-transformer';

describe('gatewayImportsFieldTransformer', () => {
  it('VALID: {scope: "@acme"} => returns the four #gateway entries scoped to @acme', () => {
    const result = gatewayImportsFieldTransformer({
      scope: PathSegmentStub({ value: '@acme' }),
    });

    expect(result).toStrictEqual({
      '#gateway/npm/*': '@acme/npm/*',
      '#gateway/node/*': '@acme/node/*',
      '#gateway/browser/*': '@acme/browser/*',
      '#gateway/bin/*': '@acme/bin/*',
    });
  });

  it('VALID: {scope: "@dungeonmaster"} => returns the four #gateway entries scoped to @dungeonmaster', () => {
    const result = gatewayImportsFieldTransformer({
      scope: PathSegmentStub({ value: '@dungeonmaster' }),
    });

    expect(result).toStrictEqual({
      '#gateway/npm/*': '@dungeonmaster/npm/*',
      '#gateway/node/*': '@dungeonmaster/node/*',
      '#gateway/browser/*': '@dungeonmaster/browser/*',
      '#gateway/bin/*': '@dungeonmaster/bin/*',
    });
  });
});
