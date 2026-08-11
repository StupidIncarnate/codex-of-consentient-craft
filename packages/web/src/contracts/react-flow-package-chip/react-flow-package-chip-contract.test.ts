import { packageTypeStyleStatics } from '../../statics/package-type-style/package-type-style-statics';
import { reactFlowPackageChipContract } from './react-flow-package-chip-contract';
import { ReactFlowPackageChipStub } from './react-flow-package-chip.stub';

// Derived from the style map rather than restated, so a kind added to the shared enum (and given a
// colour) is covered here the same day instead of being silently skipped.
type PackageTypeKey = keyof typeof packageTypeStyleStatics.accent;
const PACKAGE_TYPES = Object.keys(packageTypeStyleStatics.accent) as readonly PackageTypeKey[];

describe('reactFlowPackageChipContract', () => {
  describe('valid inputs', () => {
    it.each(PACKAGE_TYPES)('VALID: {packageType: %s} => parses successfully', (packageType) => {
      const result = ReactFlowPackageChipStub({ name: 'storefront-ui', packageType });

      expect(result).toStrictEqual({ name: 'storefront-ui', packageType });
    });

    it('VALID: {name only} => parses as an unresolved chip carrying no packageType', () => {
      const result = reactFlowPackageChipContract.parse({ name: 'orders-api' });

      expect(result).toStrictEqual({ name: 'orders-api' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {name: ""} => throws for an empty package name', () => {
      expect(() => ReactFlowPackageChipStub({ name: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {packageType: "frontend-vue"} => throws for a kind outside the closed enum', () => {
      expect(() => ReactFlowPackageChipStub({ packageType: 'frontend-vue' as never })).toThrow(
        /Invalid enum value/u,
      );
    });
  });
});
