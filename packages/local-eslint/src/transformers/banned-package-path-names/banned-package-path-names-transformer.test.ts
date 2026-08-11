import { bannedPackagePathNamesTransformer } from './banned-package-path-names-transformer';

describe('bannedPackagePathNamesTransformer', () => {
  describe('matching', () => {
    it('VALID: {text: single workspace path} => returns the one name', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: "const root = 'packages/web/src/brokers';",
          packageNames: ['web', 'server'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual(['web']);
    });

    it('VALID: {text: two different names} => returns both in first-seen order', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: 'packages/server/src/flows and packages/web/src/brokers',
          packageNames: ['web', 'server'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual(['server', 'web']);
    });

    it('VALID: {text: same name twice} => returns it once', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: 'packages/web/playwright.config.ts and packages/web/test/harnesses/',
          packageNames: ['web'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual(['web']);
    });

    it('VALID: {text: absolute path} => returns the name', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: '/repo/packages/server/src/statics/api-routes/api-routes-statics.ts',
          packageNames: ['server'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual(['server']);
    });
  });

  describe('non-matching', () => {
    it('VALID: {text: scoped module specifier} => returns empty array', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: "import { x } from '@dungeonmaster/web';",
          packageNames: ['web'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual([]);
    });

    it('VALID: {text: longer sibling directory} => returns empty array', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: "const root = 'packages/webhooks/src';",
          packageNames: ['web'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual([]);
    });

    it('VALID: {text: workspace dir joined to a longer word} => returns empty array', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: "const root = 'sub-packages/web/src';",
          packageNames: ['web'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual([]);
    });

    it('VALID: {text: wildcard workspace glob} => returns empty array', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: "const pattern = 'packages/*/dist/startup/start-install.js';",
          packageNames: ['web', 'server'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual([]);
    });

    it('VALID: {text: bare role word with no workspace segment} => returns empty array', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: "const kind = 'web';",
          packageNames: ['web'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual([]);
    });

    it('VALID: {text: name outside the watched list} => returns empty array', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: "const root = 'packages/shared/src/statics';",
          packageNames: ['web', 'server'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual([]);
    });
  });

  describe('empty configuration', () => {
    it('EMPTY: {packageNames: []} => returns empty array', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: 'packages/web/src',
          packageNames: [],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {workspaceDirNames: []} => returns empty array', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: 'packages/web/src',
          packageNames: ['web'],
          workspaceDirNames: [],
        }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {text: ""} => returns empty array', () => {
      expect(
        bannedPackagePathNamesTransformer({
          text: '',
          packageNames: ['web'],
          workspaceDirNames: ['packages'],
        }),
      ).toStrictEqual([]);
    });
  });
});
