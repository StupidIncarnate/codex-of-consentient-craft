import { flowTestOwnedSuffixesStatics } from './flow-test-owned-suffixes-statics';

describe('flowTestOwnedSuffixesStatics', () => {
  it('VALID: exported value => is the integration-test and e2e suffixes', () => {
    expect(flowTestOwnedSuffixesStatics).toStrictEqual({
      value: ['.integration.test.ts', '.e2e.ts'],
    });
  });
});
