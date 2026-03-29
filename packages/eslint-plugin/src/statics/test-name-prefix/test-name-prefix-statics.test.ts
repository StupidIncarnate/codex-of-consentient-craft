import { testNamePrefixStatics } from './test-name-prefix-statics';

describe('testNamePrefixStatics', () => {
  it('VALID: {} => has expected valid prefixes', () => {
    expect(testNamePrefixStatics).toStrictEqual({
      validPrefixes: ['VALID:', 'INVALID:', 'ERROR:', 'EDGE:', 'EMPTY:'],
      maxDisplayLength: 60,
    });
  });
});
