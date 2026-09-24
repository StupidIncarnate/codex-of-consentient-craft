import { PackageJsonStub } from '@dungeonmaster/shared/contracts';

import { workspaceScopeDetectTransformer } from './workspace-scope-detect-transformer';

describe('workspaceScopeDetectTransformer', () => {
  describe('scoped workspace dependency present', () => {
    it('VALID: {dependencies: {"@acme/shared": "*"}} => "@acme"', () => {
      const rootPackageJson = PackageJsonStub({ dependencies: { '@acme/shared': '*' } });

      const result = workspaceScopeDetectTransformer({ rootPackageJson });

      expect(result).toBe('@acme');
    });

    it('EDGE: {dependencies: {"@acme/shared": "*", "@other/tool": "*"}} => "@acme" (first in key order wins)', () => {
      const rootPackageJson = PackageJsonStub({
        dependencies: { '@acme/shared': '*', '@other/tool': '*' },
      });

      const result = workspaceScopeDetectTransformer({ rootPackageJson });

      expect(result).toBe('@acme');
    });
  });

  describe('entries that do not qualify as a workspace dependency', () => {
    it('EDGE: {dependencies: {"lodash": "*"}} => "" (pinned to * but unscoped)', () => {
      const rootPackageJson = PackageJsonStub({ dependencies: { lodash: '*' } });

      const result = workspaceScopeDetectTransformer({ rootPackageJson });

      expect(result).toBe('');
    });

    it('EDGE: {dependencies: {"@acme/shared": "^1.0.0"}} => "" (scoped but not pinned to *)', () => {
      const rootPackageJson = PackageJsonStub({ dependencies: { '@acme/shared': '^1.0.0' } });

      const result = workspaceScopeDetectTransformer({ rootPackageJson });

      expect(result).toBe('');
    });
  });

  describe('empty or absent dependencies', () => {
    it('EMPTY: {dependencies: undefined} => ""', () => {
      const rootPackageJson = PackageJsonStub();

      const result = workspaceScopeDetectTransformer({ rootPackageJson });

      expect(result).toBe('');
    });

    it('EMPTY: {dependencies: {}} => ""', () => {
      const rootPackageJson = PackageJsonStub({ dependencies: {} });

      const result = workspaceScopeDetectTransformer({ rootPackageJson });

      expect(result).toBe('');
    });
  });
});
