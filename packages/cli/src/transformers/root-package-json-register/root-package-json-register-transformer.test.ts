import { rootPackageJsonRegisterTransformer } from './root-package-json-register-transformer';
import { PackageJsonRawStub } from '../../contracts/package-json-raw/package-json-raw.stub';
import { PackageNameStub } from '@dungeonmaster/shared/contracts';

describe('rootPackageJsonRegisterTransformer', () => {
  describe('valid input', () => {
    it('VALID: {existing sorted map, new name sorts first} => inserts at front in sorted position', () => {
      const rootPackageJson = PackageJsonRawStub({
        dependencies: {
          '@dungeonmaster/mmm': '^1.0.0',
          '@dungeonmaster/zzz': '^2.0.0',
        },
      });

      const result = rootPackageJsonRegisterTransformer({
        rootPackageJson,
        packageName: PackageNameStub({ value: '@dungeonmaster/aaa' }),
      });

      expect(result).toStrictEqual({
        name: 'stub-project',
        version: '1.0.0',
        dependencies: {
          '@dungeonmaster/aaa': '*',
          '@dungeonmaster/mmm': '^1.0.0',
          '@dungeonmaster/zzz': '^2.0.0',
        },
      });
      expect(JSON.stringify(result)).toBe(
        '{"name":"stub-project","version":"1.0.0","dependencies":{"@dungeonmaster/aaa":"*","@dungeonmaster/mmm":"^1.0.0","@dungeonmaster/zzz":"^2.0.0"}}',
      );
    });

    it('VALID: {existing sorted map, new name sorts into the middle} => inserts between its neighbors', () => {
      const rootPackageJson = PackageJsonRawStub({
        dependencies: {
          '@dungeonmaster/aaa': '^1.0.0',
          '@dungeonmaster/zzz': '^2.0.0',
        },
      });

      const result = rootPackageJsonRegisterTransformer({
        rootPackageJson,
        packageName: PackageNameStub({ value: '@dungeonmaster/mmm' }),
      });

      expect(result).toStrictEqual({
        name: 'stub-project',
        version: '1.0.0',
        dependencies: {
          '@dungeonmaster/aaa': '^1.0.0',
          '@dungeonmaster/mmm': '*',
          '@dungeonmaster/zzz': '^2.0.0',
        },
      });
      expect(JSON.stringify(result)).toBe(
        '{"name":"stub-project","version":"1.0.0","dependencies":{"@dungeonmaster/aaa":"^1.0.0","@dungeonmaster/mmm":"*","@dungeonmaster/zzz":"^2.0.0"}}',
      );
    });
  });

  describe('empty input', () => {
    it('EMPTY: {dependencies: {}} => holds only the new entry', () => {
      const rootPackageJson = PackageJsonRawStub({ dependencies: {} });

      const result = rootPackageJsonRegisterTransformer({
        rootPackageJson,
        packageName: PackageNameStub({ value: '@dungeonmaster/solo' }),
      });

      expect(result).toStrictEqual({
        name: 'stub-project',
        version: '1.0.0',
        dependencies: { '@dungeonmaster/solo': '*' },
      });
      expect(JSON.stringify(result)).toBe(
        '{"name":"stub-project","version":"1.0.0","dependencies":{"@dungeonmaster/solo":"*"}}',
      );
    });

    it('EMPTY: {no dependencies key} => appends a new dependencies key holding the entry', () => {
      const rootPackageJson = PackageJsonRawStub({ license: 'MIT' });

      const result = rootPackageJsonRegisterTransformer({
        rootPackageJson,
        packageName: PackageNameStub({ value: '@dungeonmaster/solo' }),
      });

      expect(result).toStrictEqual({
        name: 'stub-project',
        version: '1.0.0',
        license: 'MIT',
        dependencies: { '@dungeonmaster/solo': '*' },
      });
      expect(JSON.stringify(result)).toBe(
        '{"name":"stub-project","version":"1.0.0","license":"MIT","dependencies":{"@dungeonmaster/solo":"*"}}',
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {dependencies between two other top-level keys} => dependencies keeps its original position', () => {
      const rootPackageJson = PackageJsonRawStub({
        dependencies: { '@dungeonmaster/zzz': '^2.0.0' },
        license: 'MIT',
      });

      const result = rootPackageJsonRegisterTransformer({
        rootPackageJson,
        packageName: PackageNameStub({ value: '@dungeonmaster/aaa' }),
      });

      expect(result).toStrictEqual({
        name: 'stub-project',
        version: '1.0.0',
        dependencies: {
          '@dungeonmaster/aaa': '*',
          '@dungeonmaster/zzz': '^2.0.0',
        },
        license: 'MIT',
      });
      expect(JSON.stringify(result)).toBe(
        '{"name":"stub-project","version":"1.0.0","dependencies":{"@dungeonmaster/aaa":"*","@dungeonmaster/zzz":"^2.0.0"},"license":"MIT"}',
      );
    });

    it('EDGE: {packageName already registered, unsorted map} => returns rootPackageJson unchanged', () => {
      const rootPackageJson = PackageJsonRawStub({
        dependencies: {
          '@dungeonmaster/zzz': '^2.0.0',
          '@dungeonmaster/aaa': '^1.0.0',
        },
      });

      const result = rootPackageJsonRegisterTransformer({
        rootPackageJson,
        packageName: PackageNameStub({ value: '@dungeonmaster/zzz' }),
      });

      expect(result).toStrictEqual(rootPackageJson);
      expect(JSON.stringify(result)).toBe(
        '{"name":"stub-project","version":"1.0.0","dependencies":{"@dungeonmaster/zzz":"^2.0.0","@dungeonmaster/aaa":"^1.0.0"}}',
      );
    });
  });
});
