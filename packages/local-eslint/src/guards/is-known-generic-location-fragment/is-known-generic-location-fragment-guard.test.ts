import { isKnownGenericLocationFragmentGuard } from './is-known-generic-location-fragment-guard';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { locationLiteralStatics } from '../../statics/location-literal/location-literal-statics';
import { locationLiteralKeyPathsTransformer } from '../../transformers/location-literal-key-paths/location-literal-key-paths-transformer';

describe('isKnownGenericLocationFragmentGuard', () => {
  describe('known extensions', () => {
    it('VALID: {value: ".json"} => returns true', () => {
      expect(isKnownGenericLocationFragmentGuard({ value: '.json' })).toBe(true);
    });

    it('VALID: {value: ".sock"} => returns true', () => {
      expect(isKnownGenericLocationFragmentGuard({ value: '.sock' })).toBe(true);
    });
  });

  describe('genuine filenames and dirnames', () => {
    it('VALID: {value: "registry.json"} => returns false', () => {
      expect(isKnownGenericLocationFragmentGuard({ value: 'registry.json' })).toBe(false);
    });

    it('VALID: {value: ".siegelense"} => returns false — a complete dotfile name', () => {
      expect(isKnownGenericLocationFragmentGuard({ value: '.siegelense' })).toBe(false);
    });

    it('VALID: {value: "step"} => returns false — a word, not an extension', () => {
      expect(isKnownGenericLocationFragmentGuard({ value: 'step' })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {value: undefined} => returns false', () => {
      expect(isKnownGenericLocationFragmentGuard({})).toBe(false);
    });
  });

  describe('regression: locationsStatics carries no bare extension fragment', () => {
    it('VALID: every value no-bare-location-literals retains from locationsStatics => is not a known generic extension', () => {
      const retainedLiterals = locationLiteralKeyPathsTransformer({
        source: locationsStatics,
        rootName: 'locationsStatics',
        minRetainedLength: locationLiteralStatics.minRetainedLiteralLength,
        excludedLiterals: locationLiteralStatics.excludedLiterals,
      });

      const carriesNoGenericExtension = Array.from(retainedLiterals.keys()).every(
        (literal) => !isKnownGenericLocationFragmentGuard({ value: literal }),
      );

      expect(carriesNoGenericExtension).toBe(true);
    });
  });
});
