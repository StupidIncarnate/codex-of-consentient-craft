import { packageBuildOrderStatics } from '../../statics/package-build-order/package-build-order-statics';

import { packageTypeContract } from './package-type-contract';
import { PackageTypeStub } from './package-type.stub';

describe('packageTypeContract', () => {
  describe('valid types', () => {
    it('VALID: http-backend => parses successfully', () => {
      const type = PackageTypeStub({ value: 'http-backend' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('http-backend');
    });

    it('VALID: mcp-server => parses successfully', () => {
      const type = PackageTypeStub({ value: 'mcp-server' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('mcp-server');
    });

    it('VALID: frontend-react => parses successfully', () => {
      const type = PackageTypeStub({ value: 'frontend-react' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('frontend-react');
    });

    it('VALID: frontend-ink => parses successfully', () => {
      const type = PackageTypeStub({ value: 'frontend-ink' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('frontend-ink');
    });

    it('VALID: hook-handlers => parses successfully', () => {
      const type = PackageTypeStub({ value: 'hook-handlers' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('hook-handlers');
    });

    it('VALID: eslint-plugin => parses successfully', () => {
      const type = PackageTypeStub({ value: 'eslint-plugin' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('eslint-plugin');
    });

    it('VALID: cli-tool => parses successfully', () => {
      const type = PackageTypeStub({ value: 'cli-tool' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('cli-tool');
    });

    it('VALID: programmatic-service => parses successfully', () => {
      const type = PackageTypeStub({ value: 'programmatic-service' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('programmatic-service');
    });

    it('VALID: library => parses successfully', () => {
      const type = PackageTypeStub({ value: 'library' });

      const result = packageTypeContract.parse(type);

      expect(result).toBe('library');
    });
  });

  describe('invalid types', () => {
    it('INVALID: unknown type string => throws validation error', () => {
      expect(() => {
        packageTypeContract.parse('not-a-valid-type');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: empty string => throws validation error', () => {
      expect(() => {
        packageTypeContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });
  });
});

// This lives here, not in package-build-order-statics.test.ts, because packageBuildOrderStatics
// is DATA (statics may only import statics), so its colocated test cannot import
// packageTypeContract to walk the enum live — enforce-contract-usage-in-tests blocks a statics
// test from importing a contract, and enforce-import-dependencies blocks a statics file from
// importing one. A contract test can import both its own contract and statics, so only here can
// the assertion iterate packageTypeContract's live options instead of a pinned literal list —
// catching a kind added to the enum that never got a tier, which would otherwise rank last in
// operationsCodeweaverOrderTransformer and schedule its package's session after every consumer of
// it.
describe('cross-check against packageBuildOrderStatics', () => {
  it.each(packageTypeContract.unwrap().options)(
    'VALID: {packageType: %s} => has exactly one tier in packageBuildOrderStatics',
    (packageType) => {
      const tierCount = packageBuildOrderStatics.tiers.filter((tier) =>
        tier.some((kind) => kind === packageType),
      ).length;

      expect(tierCount).toBe(1);
    },
  );
});
