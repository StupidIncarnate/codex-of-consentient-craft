import { QuestPackageEntryStub } from '../../contracts/quest-package-entry/quest-package-entry.stub';

import { packageForPathTransformer } from './package-for-path-transformer';

const WEB = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  packageType: 'frontend-react',
});
const SERVER = QuestPackageEntryStub({
  name: 'server',
  location: './packages/server',
  packageType: 'http-backend',
});
// Declared INSIDE web's tree. The longest-prefix rule is what stops the enclosing declaration
// swallowing this package's own paths.
const NESTED_CHART = QuestPackageEntryStub({
  name: 'chart',
  location: './packages/web/plugins/chart',
  packageType: 'library',
});

describe('packageForPathTransformer', () => {
  describe('resolves to the declaring package', () => {
    it('VALID: {path: packages/web/src/widgets/x.tsx, web declared} => returns web', () => {
      const result = packageForPathTransformer({
        path: 'packages/web/src/widgets/x.tsx',
        packagesAffected: [WEB, SERVER],
      });

      expect(result).toBe('web');
    });

    it('VALID: {path is the declared location itself} => returns that package, not undefined', () => {
      const result = packageForPathTransformer({
        path: 'packages/server',
        packagesAffected: [WEB, SERVER],
      });

      expect(result).toBe('server');
    });

    it('VALID: {an absolute declared location and an absolute path under it} => returns that package', () => {
      const legacy = QuestPackageEntryStub({
        name: 'legacy',
        location: '/srv/legacy',
        packageType: 'library',
      });

      const result = packageForPathTransformer({
        path: '/srv/legacy/src/contracts/thing-contract.ts',
        packagesAffected: [legacy],
      });

      expect(result).toBe('legacy');
    });
  });

  describe('mixed shapes are reduced before comparison', () => {
    it('VALID: {declared "./packages/web", path "./packages/web/src/x.tsx"} => the ./ prefix on both sides is stripped', () => {
      const result = packageForPathTransformer({
        path: './packages/web/src/x.tsx',
        packagesAffected: [WEB],
      });

      expect(result).toBe('web');
    });

    it('VALID: {declared "./packages/tooling/", bare path under it} => the trailing slash does not block the match', () => {
      const tooling = QuestPackageEntryStub({
        name: 'tooling',
        location: './packages/tooling/',
        packageType: 'library',
      });

      const result = packageForPathTransformer({
        path: 'packages/tooling/src/brokers/x-broker.ts',
        packagesAffected: [tooling],
      });

      expect(result).toBe('tooling');
    });

    it('VALID: {declared "./packages/web/", path "packages/web/"} => both reduce to the same prefix and match exactly', () => {
      const web = QuestPackageEntryStub({
        name: 'web',
        location: './packages/web/',
        packageType: 'frontend-react',
      });

      const result = packageForPathTransformer({
        path: 'packages/web/',
        packagesAffected: [web],
      });

      expect(result).toBe('web');
    });
  });

  describe('longest prefix wins', () => {
    it('VALID: {a package declared inside another package tree} => the inner package claims its own path', () => {
      const result = packageForPathTransformer({
        path: 'packages/web/plugins/chart/src/contracts/series-contract.ts',
        packagesAffected: [WEB, NESTED_CHART],
      });

      expect(result).toBe('chart');
    });

    it('VALID: {inner package declared FIRST, a path only the outer one covers} => still resolves to the outer package', () => {
      const result = packageForPathTransformer({
        path: 'packages/web/src/widgets/x.tsx',
        packagesAffected: [NESTED_CHART, WEB],
      });

      expect(result).toBe('web');
    });
  });

  describe('resolves nowhere rather than to the nearest guess', () => {
    it('EMPTY: {path under no declared location} => returns undefined', () => {
      const result = packageForPathTransformer({
        path: 'packages/cli/src/startup/start-cli.ts',
        packagesAffected: [WEB, SERVER],
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {packagesAffected: []} => returns undefined', () => {
      const result = packageForPathTransformer({
        path: 'packages/web/src/widgets/x.tsx',
        packagesAffected: [],
      });

      expect(result).toBe(undefined);
    });

    // A sibling directory whose name merely STARTS with a declared package's name is not inside it.
    // Without the `${prefix}/` boundary this would silently widen web's scope by a whole package.
    it('EDGE: {packages/web-extra/... while only web is declared} => returns undefined, not web', () => {
      const result = packageForPathTransformer({
        path: 'packages/web-extra/src/x.tsx',
        packagesAffected: [WEB],
      });

      expect(result).toBe(undefined);
    });

    // './' reduces to the empty prefix, which would otherwise match EVERY path and hand the whole
    // repo to one package.
    it('EDGE: {a declared location of "./"} => contributes no prefix, so nothing resolves to it', () => {
      const wholeRepo = QuestPackageEntryStub({
        name: 'root',
        location: './',
        packageType: 'library',
      });

      const result = packageForPathTransformer({
        path: 'packages/web/src/x.tsx',
        packagesAffected: [wholeRepo],
      });

      expect(result).toBe(undefined);
    });

    it('EDGE: {a declared location of "./" alongside a real one} => the real declaration still wins its own paths', () => {
      const wholeRepo = QuestPackageEntryStub({
        name: 'root',
        location: './',
        packageType: 'library',
      });

      const result = packageForPathTransformer({
        path: 'packages/web/src/x.tsx',
        packagesAffected: [wholeRepo, WEB],
      });

      expect(result).toBe('web');
    });
  });
});
