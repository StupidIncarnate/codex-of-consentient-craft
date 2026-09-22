import { webBundlePackageResolveBroker } from './web-bundle-package-resolve-broker';
import { webBundlePackageResolveBrokerProxy } from './web-bundle-package-resolve-broker.proxy';

describe('webBundlePackageResolveBroker', () => {
  describe('a single dependency declares react', () => {
    it('VALID: {dependencies: [@dungeonmaster/web]} => returns @dungeonmaster/web', async () => {
      const proxy = webBundlePackageResolveBrokerProxy();
      proxy.setupOwnDependencies({ dependencyNames: ['@dungeonmaster/web'] });
      proxy.setupCandidateReact({ candidateName: '@dungeonmaster/web' });

      const result = await webBundlePackageResolveBroker();

      expect(result).toBe('@dungeonmaster/web');
    });
  });

  describe('several dependencies, exactly one declares react', () => {
    it('VALID: {dependencies: [web (react), server (no react)]} => returns web', async () => {
      const proxy = webBundlePackageResolveBrokerProxy();
      proxy.setupOwnDependencies({
        dependencyNames: ['@dungeonmaster/web', '@dungeonmaster/server'],
      });
      proxy.setupCandidateReact({ candidateName: '@dungeonmaster/web' });
      proxy.setupCandidateNoReact({ candidateName: '@dungeonmaster/server' });

      const result = await webBundlePackageResolveBroker();

      expect(result).toBe('@dungeonmaster/web');
    });
  });

  describe('a dependency with no installed package on disk', () => {
    it('EDGE: {dependencies: [unresolvable, web (react)]} => skips the unresolvable one and returns web', async () => {
      const proxy = webBundlePackageResolveBrokerProxy();
      proxy.setupOwnDependencies({
        dependencyNames: ['@dungeonmaster/nonexistent-test-package', '@dungeonmaster/web'],
      });
      proxy.setupCandidateReact({ candidateName: '@dungeonmaster/web' });

      const result = await webBundlePackageResolveBroker();

      expect(result).toBe('@dungeonmaster/web');
    });
  });

  describe('no dependency declares react', () => {
    it('ERROR: {dependencies: [web (no react), server (no react)]} => throws naming both checked candidates', async () => {
      const proxy = webBundlePackageResolveBrokerProxy();
      proxy.setupOwnDependencies({
        dependencyNames: ['@dungeonmaster/web', '@dungeonmaster/server'],
      });
      proxy.setupCandidateNoReact({ candidateName: '@dungeonmaster/web' });
      proxy.setupCandidateNoReact({ candidateName: '@dungeonmaster/server' });

      await expect(webBundlePackageResolveBroker()).rejects.toThrow(
        /^No web-bundle package found among this package's own @dungeonmaster\/\* dependencies \(checked: @dungeonmaster\/web, @dungeonmaster\/server\)\. A frontend dependency must declare 'react' among its own dependencies\.$/u,
      );
    });
  });

  describe('no @dungeonmaster-scoped dependency at all', () => {
    it('EMPTY: {dependencies: [hono]} => throws naming no candidates checked', async () => {
      const proxy = webBundlePackageResolveBrokerProxy();
      proxy.setupOwnDependencies({ dependencyNames: ['hono'] });

      await expect(webBundlePackageResolveBroker()).rejects.toThrow(
        /^No web-bundle package found among this package's own @dungeonmaster\/\* dependencies \(checked: \)\. A frontend dependency must declare 'react' among its own dependencies\.$/u,
      );
    });
  });

  describe('two dependencies both declare react', () => {
    it('ERROR: {dependencies: [web (react), server (react)]} => throws naming both ambiguous candidates', async () => {
      const proxy = webBundlePackageResolveBrokerProxy();
      proxy.setupOwnDependencies({
        dependencyNames: ['@dungeonmaster/web', '@dungeonmaster/server'],
      });
      proxy.setupCandidateReact({ candidateName: '@dungeonmaster/web' });
      proxy.setupCandidateReact({ candidateName: '@dungeonmaster/server' });

      await expect(webBundlePackageResolveBroker()).rejects.toThrow(
        /^Ambiguous web-bundle package — more than one @dungeonmaster\/\* dependency declares 'react': @dungeonmaster\/web, @dungeonmaster\/server\.$/u,
      );
    });
  });
});
