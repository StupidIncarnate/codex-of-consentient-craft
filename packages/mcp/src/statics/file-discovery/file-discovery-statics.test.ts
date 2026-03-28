import { fileDiscoveryStatics } from './file-discovery-statics';

describe('fileDiscoveryStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(fileDiscoveryStatics).toStrictEqual({
      standaloneMultiDotSuffixes: ['.harness.'],
      pathAnchors: ['src', 'test'],
      pluralSuffixes: {
        esSuffix: { ending: 'ses', stripLength: 2 },
        sSuffix: { ending: 's', stripLength: 1 },
      },
      minPartsAfterAnchor: 2,
    });
  });
});
