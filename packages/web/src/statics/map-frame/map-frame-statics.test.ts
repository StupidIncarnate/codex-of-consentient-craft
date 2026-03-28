import { mapFrameStatics } from './map-frame-statics';

describe('mapFrameStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(mapFrameStatics).toStrictEqual({
      defaultMinHeight: 280,
      defaultMaxWidth: 740,
      defaultPadding: 16,
      unrestrictedMaxWidth: 99999,
    });
  });
});
