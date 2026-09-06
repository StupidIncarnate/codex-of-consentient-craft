import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { e2eArtifactsPruneBroker } from './e2e-artifacts-prune-broker';
import { e2eArtifactsPruneBrokerProxy } from './e2e-artifacts-prune-broker.proxy';

const PACKAGE_ROOT = '/repo/packages/web';

describe('e2eArtifactsPruneBroker', () => {
  describe('the vite cache, on a two-day window', () => {
    it('VALID: {.vite-40000 three days old, port free} => removes it', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: PACKAGE_ROOT });
      const proxy = e2eArtifactsPruneBrokerProxy();

      proxy.setupEntries({ packageRoot, parentDir: 'node_modules', entries: ['.vite-40000'] });
      proxy.setupAge({ packageRoot, parentDir: 'node_modules', name: '.vite-40000', daysOld: 3 });
      proxy.setupPortFree({ port: 40000 });
      proxy.setupRemovable({ packageRoot, parentDir: 'node_modules', name: '.vite-40000' });

      await expect(e2eArtifactsPruneBroker({ packageRoot })).resolves.toStrictEqual({
        success: true,
      });

      expect(
        proxy.getRemovedPaths({ packageRoot, parentDir: 'node_modules', name: '.vite-40000' }),
      ).toStrictEqual([
        ['/repo/packages/web/node_modules/.vite-40000', { recursive: true, force: true }],
      ]);
    });

    it('VALID: {.vite-40000 one day old} => leaves it, being inside the window', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: PACKAGE_ROOT });
      const proxy = e2eArtifactsPruneBrokerProxy();

      proxy.setupEntries({ packageRoot, parentDir: 'node_modules', entries: ['.vite-40000'] });
      proxy.setupAge({ packageRoot, parentDir: 'node_modules', name: '.vite-40000', daysOld: 1 });

      await e2eArtifactsPruneBroker({ packageRoot });

      expect(
        proxy.getRemovedPaths({ packageRoot, parentDir: 'node_modules', name: '.vite-40000' }),
      ).toStrictEqual([]);
    });
  });

  describe('traces, on the longer evidence window', () => {
    // test-results holds the trace and screenshot of a failing run. Three days must NOT be enough
    // to lose them — that is the whole reason the two windows differ.
    it('VALID: {test-results/40000 three days old} => kept, unlike the cache of the same age', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: PACKAGE_ROOT });
      const proxy = e2eArtifactsPruneBrokerProxy();

      proxy.setupEntries({ packageRoot, parentDir: 'test-results', entries: ['40000'] });
      proxy.setupAge({ packageRoot, parentDir: 'test-results', name: '40000', daysOld: 3 });

      await e2eArtifactsPruneBroker({ packageRoot });

      expect(
        proxy.getRemovedPaths({ packageRoot, parentDir: 'test-results', name: '40000' }),
      ).toStrictEqual([]);
    });

    it('VALID: {test-results/40000 eight days old, port free} => removes it', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: PACKAGE_ROOT });
      const proxy = e2eArtifactsPruneBrokerProxy();

      proxy.setupEntries({ packageRoot, parentDir: 'test-results', entries: ['40000'] });
      proxy.setupAge({ packageRoot, parentDir: 'test-results', name: '40000', daysOld: 8 });
      proxy.setupPortFree({ port: 40000 });
      proxy.setupRemovable({ packageRoot, parentDir: 'test-results', name: '40000' });

      await e2eArtifactsPruneBroker({ packageRoot });

      expect(
        proxy.getRemovedPaths({ packageRoot, parentDir: 'test-results', name: '40000' }),
      ).toStrictEqual([
        ['/repo/packages/web/test-results/40000', { recursive: true, force: true }],
      ]);
    });
  });

  describe('a port a live run still holds', () => {
    // Ports recur. A run handed 40000 seconds ago has not written to its cache yet, so the stale
    // directory still on disk reads as abandoned. Taking it kills that run, and the symptom points
    // nowhere near a cleanup.
    it('VALID: {.vite-40000 stale but port bound} => leaves it alone', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: PACKAGE_ROOT });
      const proxy = e2eArtifactsPruneBrokerProxy();

      proxy.setupEntries({ packageRoot, parentDir: 'node_modules', entries: ['.vite-40000'] });
      proxy.setupAge({ packageRoot, parentDir: 'node_modules', name: '.vite-40000', daysOld: 30 });
      proxy.setupPortHeld({ port: 40000 });

      await e2eArtifactsPruneBroker({ packageRoot });

      expect(
        proxy.getRemovedPaths({ packageRoot, parentDir: 'node_modules', name: '.vite-40000' }),
      ).toStrictEqual([]);
    });
  });

  describe('another project’s files', () => {
    // Playwright's default outputDir is test-results/ and names folders after the spec. A repo that
    // never adopted per-port paths keeps its failure traces here.
    it('VALID: {test-results holds a spec-named folder} => never stats or removes it', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: PACKAGE_ROOT });
      const proxy = e2eArtifactsPruneBrokerProxy();

      proxy.setupEntries({
        packageRoot,
        parentDir: 'test-results',
        entries: ['my-spec-renders-chromium'],
      });

      await expect(e2eArtifactsPruneBroker({ packageRoot })).resolves.toStrictEqual({
        success: true,
      });

      expect(
        proxy.getRemovedPaths({
          packageRoot,
          parentDir: 'test-results',
          name: 'my-spec-renders-chromium',
        }),
      ).toStrictEqual([]);
    });
  });

  describe('one entry failing must not abandon the rest', () => {
    // Four browser walks sweep one directory at once, so losing a race is the common case. A single
    // try around the whole loop would reap one directory per run while the disk still filled.
    it('VALID: {first removal throws ENOTEMPTY} => the second is still removed', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: PACKAGE_ROOT });
      const proxy = e2eArtifactsPruneBrokerProxy();

      proxy.setupEntries({
        packageRoot,
        parentDir: 'node_modules',
        entries: ['.vite-40000', '.vite-51244'],
      });
      proxy.setupAge({ packageRoot, parentDir: 'node_modules', name: '.vite-40000', daysOld: 5 });
      proxy.setupAge({ packageRoot, parentDir: 'node_modules', name: '.vite-51244', daysOld: 5 });
      proxy.setupPortFree({ port: 40000 });
      proxy.setupPortFree({ port: 51244 });
      proxy.setupRemoveFails({ packageRoot, parentDir: 'node_modules', name: '.vite-40000' });
      proxy.setupRemovable({ packageRoot, parentDir: 'node_modules', name: '.vite-51244' });

      await expect(e2eArtifactsPruneBroker({ packageRoot })).resolves.toStrictEqual({
        success: true,
      });

      expect({
        attempted: proxy.getRemovedPaths({
          packageRoot,
          parentDir: 'node_modules',
          name: '.vite-40000',
        }),
        survivor: proxy.getRemovedPaths({
          packageRoot,
          parentDir: 'node_modules',
          name: '.vite-51244',
        }),
      }).toStrictEqual({
        attempted: [
          ['/repo/packages/web/node_modules/.vite-40000', { recursive: true, force: true }],
        ],
        survivor: [
          ['/repo/packages/web/node_modules/.vite-51244', { recursive: true, force: true }],
        ],
      });
    });
  });

  describe('a package with none of these directories', () => {
    it('EMPTY: {every parent dir absent} => resolves success without removing anything', async () => {
      const packageRoot = AbsoluteFilePathStub({ value: PACKAGE_ROOT });
      const proxy = e2eArtifactsPruneBrokerProxy();

      proxy.setupEntries({ packageRoot, parentDir: 'node_modules', entries: [] });

      await expect(e2eArtifactsPruneBroker({ packageRoot })).resolves.toStrictEqual({
        success: true,
      });
    });
  });
});
