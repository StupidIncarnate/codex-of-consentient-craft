import { PackageTypeStub } from '@dungeonmaster/shared/contracts';

import { packageTypeStyleStatics } from '../../statics/package-type-style/package-type-style-statics';
import { packageChipAccentTransformer } from './package-chip-accent-transformer';

// Derived from the style map rather than restated, so a kind added to the shared enum (and given a
// colour) is covered here the same day instead of being silently skipped.
type PackageTypeKey = keyof typeof packageTypeStyleStatics.accent;
const PACKAGE_TYPES = Object.keys(packageTypeStyleStatics.accent) as readonly PackageTypeKey[];

describe('packageChipAccentTransformer', () => {
  describe('resolved kinds', () => {
    it.each(PACKAGE_TYPES)(
      'VALID: {packageType: %s} => returns that kind palette token',
      (packageType) => {
        const result = packageChipAccentTransformer({
          packageType: PackageTypeStub({ value: packageType }),
        });

        expect(result).toBe(packageTypeStyleStatics.accent[packageType]);
      },
    );

    // The no-hardcode rule as a colour claim: a repo may hold several UI packages and every one of
    // them must paint alike, while a service beside them must not.
    it('VALID: {frontend-ink} => shares the e2e-eligible token with frontend-react', () => {
      const inkAccent = packageChipAccentTransformer({
        packageType: PackageTypeStub({ value: 'frontend-ink' }),
      });

      expect(inkAccent).toBe(packageTypeStyleStatics.accent['frontend-react']);
    });

    it('VALID: {http-backend} => does not share the e2e-eligible token', () => {
      const backendAccent = packageChipAccentTransformer({
        packageType: PackageTypeStub({ value: 'http-backend' }),
      });

      expect(backendAccent).toBe(packageTypeStyleStatics.accent['http-backend']);
    });
  });

  describe('unresolved kind', () => {
    it('EMPTY: {no packageType} => returns the unresolved token rather than borrowing a tier colour', () => {
      const result = packageChipAccentTransformer({});

      expect(result).toBe(packageTypeStyleStatics.unresolved);
    });
  });
});
