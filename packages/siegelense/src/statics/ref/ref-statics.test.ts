import { refStatics } from './ref-statics';

describe('refStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(refStatics).toStrictEqual({
      boundaries: {
        detached: 'detached',
        navigation: 'navigation',
      },
      registry: {
        globalName: '__siege',
        arrayName: 'refs',
        targetAttribute: 'siege-target',
      },
    });
  });

  it('VALID: registry.targetAttribute => carries no data- prefix, so the attrs column can never report it', () => {
    expect(refStatics.registry.targetAttribute.startsWith('data-')).toBe(false);
  });

  it('VALID: boundaries => exactly the two that are distinguishable from the driver side', () => {
    expect(refStatics.boundaries).toStrictEqual({
      detached: 'detached',
      navigation: 'navigation',
    });
  });
});
