import { jestCacheStatics } from '../../../statics/jest-cache/jest-cache-statics';
import { jestCachePruneBroker } from './jest-cache-prune-broker';
import { jestCachePruneBrokerProxy } from './jest-cache-prune-broker.proxy';

const CACHE_DIR = '/tmp/jest_rs';
const DAY_MS = 86_400_000;
const WINDOW_MS = jestCacheStatics.prune.maxAgeMs;
const STALE_MS = WINDOW_MS + DAY_MS;
const VERY_STALE_MS = WINDOW_MS + WINDOW_MS;

describe('jestCachePruneBroker', () => {
  describe('which entries go', () => {
    it('VALID: {stale haste-map file, stale transform dir, fresh entries} => removes only the stale two, recursively', async () => {
      const proxy = jestCachePruneBrokerProxy();
      const entries = [
        'haste-map-old',
        'jest-transform-cache-old',
        'haste-map-fresh',
        'jest-transform-cache-fresh',
      ];
      proxy.setupEntries({ cacheDir: CACHE_DIR, entries });
      proxy.setupAge({ path: `${CACHE_DIR}/haste-map-old`, ageMs: STALE_MS });
      proxy.setupAge({ path: `${CACHE_DIR}/jest-transform-cache-old`, ageMs: VERY_STALE_MS });
      proxy.setupAge({ path: `${CACHE_DIR}/haste-map-fresh`, ageMs: DAY_MS });
      proxy.setupAge({ path: `${CACHE_DIR}/jest-transform-cache-fresh`, ageMs: 0 });
      proxy.setupRemovable({ path: `${CACHE_DIR}/haste-map-old` });
      proxy.setupRemovable({ path: `${CACHE_DIR}/jest-transform-cache-old` });

      await expect(jestCachePruneBroker()).resolves.toStrictEqual({ success: true });

      expect(proxy.getRemoveCalls()).toStrictEqual([
        [`${CACHE_DIR}/haste-map-old`, { recursive: true, force: true }],
        [`${CACHE_DIR}/jest-transform-cache-old`, { recursive: true, force: true }],
      ]);
      expect(proxy.getStderrText()).toBe('');
    });

    it('EDGE: {entry a day inside the window} => kept, a day past it => removed', async () => {
      const proxy = jestCachePruneBrokerProxy();
      proxy.setupEntries({ cacheDir: CACHE_DIR, entries: ['inside-window', 'past-window'] });
      proxy.setupAge({ path: `${CACHE_DIR}/inside-window`, ageMs: WINDOW_MS - DAY_MS });
      proxy.setupAge({ path: `${CACHE_DIR}/past-window`, ageMs: STALE_MS });
      proxy.setupRemovable({ path: `${CACHE_DIR}/past-window` });

      await jestCachePruneBroker();

      expect(proxy.getRemovedPaths()).toStrictEqual([`${CACHE_DIR}/past-window`]);
    });

    it('EMPTY: {cache directory holds nothing} => removes nothing', async () => {
      const proxy = jestCachePruneBrokerProxy();
      proxy.setupEntries({ cacheDir: CACHE_DIR, entries: [] });

      await expect(jestCachePruneBroker()).resolves.toStrictEqual({ success: true });

      expect(proxy.getRemovedPaths()).toStrictEqual([]);
    });

    it('EMPTY: {cache directory does not exist} => resolves quietly, removes nothing', async () => {
      const proxy = jestCachePruneBrokerProxy();
      proxy.setupCacheMissing({ cacheDir: CACHE_DIR });

      await expect(jestCachePruneBroker()).resolves.toStrictEqual({ success: true });

      expect(proxy.getRemovedPaths()).toStrictEqual([]);
      expect(proxy.getStderrText()).toBe('');
    });
  });

  describe('which directory is swept', () => {
    it('VALID: {uid 36} => sweeps jest_10, the uid in base 36', async () => {
      const proxy = jestCachePruneBrokerProxy();
      proxy.setupUid({ uid: 36 });
      proxy.setupEntries({ cacheDir: '/tmp/jest_10', entries: ['stale'] });
      proxy.setupAge({ path: '/tmp/jest_10/stale', ageMs: STALE_MS });
      proxy.setupRemovable({ path: '/tmp/jest_10/stale' });

      await jestCachePruneBroker();

      expect(proxy.getRemovedPaths()).toStrictEqual(['/tmp/jest_10/stale']);
    });

    it('VALID: {no uid on the platform} => sweeps plain jest', async () => {
      const proxy = jestCachePruneBrokerProxy();
      proxy.setupUid({ uid: -1 });
      proxy.setupEntries({ cacheDir: '/tmp/jest', entries: ['stale'] });
      proxy.setupAge({ path: '/tmp/jest/stale', ageMs: STALE_MS });
      proxy.setupRemovable({ path: '/tmp/jest/stale' });

      await jestCachePruneBroker();

      expect(proxy.getRemovedPaths()).toStrictEqual(['/tmp/jest/stale']);
    });

    it('VALID: {tmpdir is a symlink} => sweeps under its resolved path, as Jest does', async () => {
      const proxy = jestCachePruneBrokerProxy();
      proxy.setupRealTmp({ tmp: '/var/tmp-link', resolved: '/private/tmp' });
      proxy.setupEntries({ cacheDir: '/private/tmp/jest_rs', entries: ['stale'] });
      proxy.setupAge({ path: '/private/tmp/jest_rs/stale', ageMs: STALE_MS });
      proxy.setupRemovable({ path: '/private/tmp/jest_rs/stale' });

      await jestCachePruneBroker();

      expect(proxy.getRemovedPaths()).toStrictEqual(['/private/tmp/jest_rs/stale']);
    });
  });

  describe('a failure never fails the run', () => {
    it('ERROR: {one removal is refused} => logs it, still removes the other stale entry', async () => {
      const proxy = jestCachePruneBrokerProxy();
      proxy.setupEntries({ cacheDir: CACHE_DIR, entries: ['refused', 'removed'] });
      proxy.setupAge({ path: `${CACHE_DIR}/refused`, ageMs: STALE_MS });
      proxy.setupAge({ path: `${CACHE_DIR}/removed`, ageMs: STALE_MS });
      proxy.setupRemoveFails({ path: `${CACHE_DIR}/refused` });
      proxy.setupRemovable({ path: `${CACHE_DIR}/removed` });

      await expect(jestCachePruneBroker()).resolves.toStrictEqual({ success: true });

      expect(proxy.getRemovedPaths()).toStrictEqual([
        `${CACHE_DIR}/refused`,
        `${CACHE_DIR}/removed`,
      ]);
      expect(proxy.getStderrText()).toBe(
        `ward: could not prune Jest cache entry ${CACHE_DIR}/refused: Error: ENOTEMPTY: rm '${CACHE_DIR}/refused'\n`,
      );
    });

    it('ERROR: {tmpdir cannot be resolved} => logs that the prune was skipped and resolves', async () => {
      const proxy = jestCachePruneBrokerProxy();
      proxy.setupRealpathMissing({ tmp: '/gone' });

      await expect(jestCachePruneBroker()).resolves.toStrictEqual({ success: true });

      expect(proxy.getRemovedPaths()).toStrictEqual([]);
      expect(proxy.getStderrText()).toBe(
        "ward: Jest cache prune skipped: Error: ENOENT: op '/gone'\n",
      );
    });
  });
});
