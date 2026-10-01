import { staleTempFilesRemoveLayerBroker } from './stale-temp-files-remove-layer-broker';
import { staleTempFilesRemoveLayerBrokerProxy } from './stale-temp-files-remove-layer-broker.proxy';

const cacheDir = '/repo/node_modules/.cache/dungeonmaster/owner-index';
const NOW_MS = 1_800_000_000_000;
const HOUR_MS = 3_600_000;

describe('staleTempFilesRemoveLayerBroker', () => {
  describe('temp files of different ages', () => {
    it('VALID: {one temp file over an hour old, one younger, one shard} => removes only the old temp file', () => {
      const proxy = staleTempFilesRemoveLayerBrokerProxy();
      proxy.setupNow({ ms: NOW_MS });
      proxy.setupTempFiles({
        cacheDir,
        files: [
          { name: '@repo__alpha.json.111-0.tmp', modifiedAtMs: NOW_MS - HOUR_MS - 1 },
          { name: '@repo__alpha.json.222-0.tmp', modifiedAtMs: NOW_MS - HOUR_MS + 1 },
          { name: '@repo__alpha.json', modifiedAtMs: NOW_MS - 10 * HOUR_MS },
        ],
      });

      staleTempFilesRemoveLayerBroker({ cacheDir });

      expect({
        old: proxy.unlinkCalls({ path: `${cacheDir}/@repo__alpha.json.111-0.tmp` }),
        young: proxy.unlinkCalls({ path: `${cacheDir}/@repo__alpha.json.222-0.tmp` }),
        shard: proxy.unlinkCalls({ path: `${cacheDir}/@repo__alpha.json` }),
        stderr: proxy.stderrText(),
      }).toStrictEqual({
        old: [[`${cacheDir}/@repo__alpha.json.111-0.tmp`]],
        young: [],
        shard: [],
        stderr: '',
      });
    });
  });

  describe('failures', () => {
    it('ERROR: {unlink fails with EACCES} => reports one stderr line and goes on to the next file', () => {
      const proxy = staleTempFilesRemoveLayerBrokerProxy();
      proxy.setupNow({ ms: NOW_MS });
      proxy.setupTempFiles({
        cacheDir,
        files: [
          { name: 'a.json.1-0.tmp', modifiedAtMs: 0 },
          { name: 'b.json.2-0.tmp', modifiedAtMs: 0 },
        ],
      });
      proxy.setupUnlinkFails({ path: `${cacheDir}/a.json.1-0.tmp`, code: 'EACCES' });

      staleTempFilesRemoveLayerBroker({ cacheDir });

      expect({
        removedB: proxy.unlinkCalls({ path: `${cacheDir}/b.json.2-0.tmp` }),
        stderr: proxy.stderrText(),
      }).toStrictEqual({
        removedB: [[`${cacheDir}/b.json.2-0.tmp`]],
        stderr: `[owner-index] stale temp file not removed: ${cacheDir}/a.json.1-0.tmp: Error: EACCES: unlink '${cacheDir}/a.json.1-0.tmp'\n`,
      });
    });

    it('EDGE: {another process removed the temp file first, ENOENT} => skips it silently', () => {
      const proxy = staleTempFilesRemoveLayerBrokerProxy();
      proxy.setupNow({ ms: NOW_MS });
      proxy.setupTempFiles({ cacheDir, files: [{ name: 'a.json.1-0.tmp', modifiedAtMs: 0 }] });
      proxy.setupUnlinkFails({ path: `${cacheDir}/a.json.1-0.tmp`, code: 'ENOENT' });

      staleTempFilesRemoveLayerBroker({ cacheDir });

      expect(proxy.stderrText()).toBe('');
    });

    it('ERROR: {cache folder cannot be listed} => reports one stderr line and returns', () => {
      const proxy = staleTempFilesRemoveLayerBrokerProxy();
      proxy.setupUnlistableCacheDir({ cacheDir });

      staleTempFilesRemoveLayerBroker({ cacheDir });

      expect(proxy.stderrText()).toBe(
        `[owner-index] stale temp files not listed: ${cacheDir}: Error: EACCES: scandir '${cacheDir}'\n`,
      );
    });
  });

  describe('empty input', () => {
    it('EMPTY: {cache folder with no files} => removes nothing and reports nothing', () => {
      const proxy = staleTempFilesRemoveLayerBrokerProxy();
      proxy.setupTempFiles({ cacheDir, files: [] });

      staleTempFilesRemoveLayerBroker({ cacheDir });

      expect(proxy.stderrText()).toBe('');
    });
  });
});
