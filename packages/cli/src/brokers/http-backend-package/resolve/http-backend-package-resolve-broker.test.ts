import { httpBackendPackageResolveBroker } from './http-backend-package-resolve-broker';
import { httpBackendPackageResolveBrokerProxy } from './http-backend-package-resolve-broker.proxy';

describe('httpBackendPackageResolveBroker', () => {
  describe('a single dependency declares hono', () => {
    it('VALID: {dependencies: [@dungeonmaster/server]} => returns @dungeonmaster/server', async () => {
      const proxy = httpBackendPackageResolveBrokerProxy();
      proxy.setupOwnDependencies({ dependencyNames: ['@dungeonmaster/server'] });
      proxy.setupCandidateHono({ candidateName: '@dungeonmaster/server' });

      const result = await httpBackendPackageResolveBroker();

      expect(result).toBe('@dungeonmaster/server');
    });
  });

  describe('several dependencies, exactly one declares hono', () => {
    it('VALID: {dependencies: [server (hono), web (no hono)]} => returns server', async () => {
      const proxy = httpBackendPackageResolveBrokerProxy();
      proxy.setupOwnDependencies({
        dependencyNames: ['@dungeonmaster/server', '@dungeonmaster/web'],
      });
      proxy.setupCandidateHono({ candidateName: '@dungeonmaster/server' });
      proxy.setupCandidateNoHono({ candidateName: '@dungeonmaster/web' });

      const result = await httpBackendPackageResolveBroker();

      expect(result).toBe('@dungeonmaster/server');
    });
  });

  describe('a dependency with no installed package on disk', () => {
    it('EDGE: {dependencies: [unresolvable, server (hono)]} => skips the unresolvable one and returns server', async () => {
      const proxy = httpBackendPackageResolveBrokerProxy();
      proxy.setupOwnDependencies({
        dependencyNames: ['@dungeonmaster/nonexistent-test-package', '@dungeonmaster/server'],
      });
      proxy.setupCandidateHono({ candidateName: '@dungeonmaster/server' });

      const result = await httpBackendPackageResolveBroker();

      expect(result).toBe('@dungeonmaster/server');
    });
  });

  describe('no dependency declares hono', () => {
    it('ERROR: {dependencies: [server (no hono), web (no hono)]} => throws naming both checked candidates', async () => {
      const proxy = httpBackendPackageResolveBrokerProxy();
      proxy.setupOwnDependencies({
        dependencyNames: ['@dungeonmaster/server', '@dungeonmaster/web'],
      });
      proxy.setupCandidateNoHono({ candidateName: '@dungeonmaster/server' });
      proxy.setupCandidateNoHono({ candidateName: '@dungeonmaster/web' });

      await expect(httpBackendPackageResolveBroker()).rejects.toThrow(
        /^No http-backend package found among this package's own @dungeonmaster\/\* dependencies \(checked: @dungeonmaster\/server, @dungeonmaster\/web\)\. A backend dependency must declare 'hono' among its own dependencies\.$/u,
      );
    });
  });

  describe('no @dungeonmaster-scoped dependency at all', () => {
    it('EMPTY: {dependencies: [zod]} => throws naming no candidates checked', async () => {
      const proxy = httpBackendPackageResolveBrokerProxy();
      proxy.setupOwnDependencies({ dependencyNames: ['zod'] });

      await expect(httpBackendPackageResolveBroker()).rejects.toThrow(
        /^No http-backend package found among this package's own @dungeonmaster\/\* dependencies \(checked: \)\. A backend dependency must declare 'hono' among its own dependencies\.$/u,
      );
    });
  });

  describe('two dependencies both declare hono', () => {
    it('ERROR: {dependencies: [server (hono), web (hono)]} => throws naming both ambiguous candidates', async () => {
      const proxy = httpBackendPackageResolveBrokerProxy();
      proxy.setupOwnDependencies({
        dependencyNames: ['@dungeonmaster/server', '@dungeonmaster/web'],
      });
      proxy.setupCandidateHono({ candidateName: '@dungeonmaster/server' });
      proxy.setupCandidateHono({ candidateName: '@dungeonmaster/web' });

      await expect(httpBackendPackageResolveBroker()).rejects.toThrow(
        /^Ambiguous http-backend package — more than one @dungeonmaster\/\* dependency declares 'hono': @dungeonmaster\/server, @dungeonmaster\/web\.$/u,
      );
    });
  });
});
