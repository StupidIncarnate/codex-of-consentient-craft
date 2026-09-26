import { gatewayTestSupportSuffixStatics } from './gateway-test-support-suffix-statics';

describe('gatewayTestSupportSuffixStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(gatewayTestSupportSuffixStatics).toStrictEqual({
      suffixes: ['.proxy.ts', '.test.ts', '.integration.test.ts', '.stub.ts'],
    });
  });
});
