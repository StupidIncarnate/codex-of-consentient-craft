import { packageBuildOrderStatics } from '@dungeonmaster/shared/statics';

import { createPackageArgsParseTransformer } from './create-package-args-parse-transformer';

describe('createPackageArgsParseTransformer', () => {
  describe('zero args', () => {
    it('EMPTY: {args: []} => returns dryRun false and nothing else', () => {
      const result = createPackageArgsParseTransformer({ args: [] });

      expect(result).toStrictEqual({ dryRun: false });
    });
  });

  describe('each flag alone', () => {
    it('VALID: {args: ["--name", "@acme/widgets"]} => returns name and dryRun false', () => {
      const result = createPackageArgsParseTransformer({ args: ['--name', '@acme/widgets'] });

      expect(result).toStrictEqual({ name: '@acme/widgets', dryRun: false });
    });

    it('VALID: {args: ["--type", "library"]} => returns packageType and dryRun false', () => {
      const result = createPackageArgsParseTransformer({ args: ['--type', 'library'] });

      expect(result).toStrictEqual({ packageType: 'library', dryRun: false });
    });

    it('VALID: {args: ["--description", "A widget package"]} => returns description and dryRun false', () => {
      const result = createPackageArgsParseTransformer({
        args: ['--description', 'A widget package'],
      });

      expect(result).toStrictEqual({ description: 'A widget package', dryRun: false });
    });

    it('VALID: {args: ["--dir", "custom-packages"]} => returns packagesDir and dryRun false', () => {
      const result = createPackageArgsParseTransformer({ args: ['--dir', 'custom-packages'] });

      expect(result).toStrictEqual({ packagesDir: 'custom-packages', dryRun: false });
    });

    it('VALID: {args: ["--dry-run"]} => returns dryRun true and nothing else', () => {
      const result = createPackageArgsParseTransformer({ args: ['--dry-run'] });

      expect(result).toStrictEqual({ dryRun: true });
    });
  });

  describe('all flags together', () => {
    it('VALID: {args: every flag} => returns every field parsed', () => {
      const result = createPackageArgsParseTransformer({
        args: [
          '--name',
          '@acme/widgets',
          '--type',
          'library',
          '--description',
          'A widget package',
          '--dir',
          'custom-packages',
          '--dry-run',
        ],
      });

      expect(result).toStrictEqual({
        name: '@acme/widgets',
        packageType: 'library',
        description: 'A widget package',
        packagesDir: 'custom-packages',
        dryRun: true,
      });
    });
  });

  describe('a value-taking flag missing its value', () => {
    it.each([['--name'], ['--type'], ['--description'], ['--dir']])(
      'INVALID: {args: ["%s"]} => throws because it is the last argument',
      (flag) => {
        expect(() => createPackageArgsParseTransformer({ args: [flag] })).toThrow(
          new RegExp(`^${flag} requires a value: it cannot be the last argument`, 'mu'),
        );
      },
    );

    it.each([['--name'], ['--type'], ['--description'], ['--dir']])(
      'INVALID: {args: ["%s", "--dry-run"]} => throws because the next token is itself a flag',
      (flag) => {
        expect(() => createPackageArgsParseTransformer({ args: [flag, '--dry-run'] })).toThrow(
          new RegExp(`^${flag} requires a value: it cannot be the last argument`, 'mu'),
        );
      },
    );
  });

  describe('unknown flag', () => {
    it('INVALID: {args: ["--bogus"]} => throws naming the offending flag', () => {
      expect(() => createPackageArgsParseTransformer({ args: ['--bogus'] })).toThrow(
        /^Unknown flag: --bogus$/mu,
      );
    });

    it('INVALID: {args: ["--bogus"]} => throws listing every accepted flag', () => {
      expect(() => createPackageArgsParseTransformer({ args: ['--bogus'] })).toThrow(
        /^Accepted flags: --name, --type, --description, --dir, --dry-run$/mu,
      );
    });
  });

  describe('positional argument', () => {
    it('INVALID: {args: ["not-a-flag"]} => throws naming the offending token', () => {
      expect(() => createPackageArgsParseTransformer({ args: ['not-a-flag'] })).toThrow(
        /^Unexpected positional argument: not-a-flag$/mu,
      );
    });
  });

  describe('invalid --type value', () => {
    it('INVALID: {args: ["--type", "not-a-real-type"]} => throws naming the offending value', () => {
      expect(() =>
        createPackageArgsParseTransformer({ args: ['--type', 'not-a-real-type'] }),
      ).toThrow(/^Invalid --type value: "not-a-real-type"$/mu);
    });

    it('INVALID: {args: ["--type", "not-a-real-type"]} => throws listing every valid package type', () => {
      const validTypes = packageBuildOrderStatics.tiers.flat().join(', ');

      expect(() =>
        createPackageArgsParseTransformer({ args: ['--type', 'not-a-real-type'] }),
      ).toThrow(new RegExp(`^Valid package types are: ${validTypes}$`, 'mu'));
    });
  });
});
