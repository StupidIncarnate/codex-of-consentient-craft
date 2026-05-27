import { PackageJsonStub } from '../../contracts/package-json/package-json.stub';
import { packageJsonDependencyNamesTransformer } from './package-json-dependency-names-transformer';

describe('packageJsonDependencyNamesTransformer()', () => {
  describe('empty dependencies', () => {
    it('EMPTY: {no dep fields} => returns empty array', () => {
      const result = packageJsonDependencyNamesTransformer({
        packageJson: PackageJsonStub({
          dependencies: undefined,
          devDependencies: undefined,
          peerDependencies: undefined,
        }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single dep field', () => {
    it('VALID: {dependencies only} => returns dependency names', () => {
      const result = packageJsonDependencyNamesTransformer({
        packageJson: PackageJsonStub({
          dependencies: { '@dm/shared': '*' },
          devDependencies: undefined,
          peerDependencies: undefined,
        }),
      });

      expect(result).toStrictEqual(['@dm/shared']);
    });

    it('VALID: {devDependencies only} => returns devDependency names', () => {
      const result = packageJsonDependencyNamesTransformer({
        packageJson: PackageJsonStub({
          dependencies: undefined,
          devDependencies: { typescript: '^5.0.0' },
          peerDependencies: undefined,
        }),
      });

      expect(result).toStrictEqual(['typescript']);
    });

    it('VALID: {peerDependencies only} => returns peerDependency names', () => {
      const result = packageJsonDependencyNamesTransformer({
        packageJson: PackageJsonStub({
          dependencies: undefined,
          devDependencies: undefined,
          peerDependencies: { react: '^18.0.0' },
        }),
      });

      expect(result).toStrictEqual(['react']);
    });
  });

  describe('multiple dep fields', () => {
    it('VALID: {deps in all three fields} => returns union of all names without duplicates', () => {
      const result = packageJsonDependencyNamesTransformer({
        packageJson: PackageJsonStub({
          dependencies: { '@dm/shared': '*' },
          devDependencies: { typescript: '^5.0.0', '@dm/shared': '*' },
          peerDependencies: { react: '^18.0.0' },
        }),
      });

      expect(result).toStrictEqual(['@dm/shared', 'typescript', 'react']);
    });

    it('VALID: {same name in deps and devDeps} => returns name once (deduplication)', () => {
      const result = packageJsonDependencyNamesTransformer({
        packageJson: PackageJsonStub({
          dependencies: { zod: '^3.0.0' },
          devDependencies: { zod: '^3.0.0' },
          peerDependencies: undefined,
        }),
      });

      expect(result).toStrictEqual(['zod']);
    });
  });
});
