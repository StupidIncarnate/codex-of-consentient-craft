import { evidenceTreeLayerBroker } from './evidence-tree-layer-broker';
import { evidenceTreeLayerBrokerProxy } from './evidence-tree-layer-broker.proxy';

const HOME_DIR = '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_e67b';
const REPO_DIR = '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_e67b';

describe('evidenceTreeLayerBroker', () => {
  describe('a populated evidence directory', () => {
    it('VALID: {logs, heartbeat, runs with shots, a video} => every file at every depth, sorted per directory, as an absolute repo-local path with its size', async () => {
      const proxy = evidenceTreeLayerBrokerProxy();
      proxy.setupDir({
        dirPath: HOME_DIR,
        files: [
          { name: 'web-server.log', bytes: 300 },
          { name: 'api-server.log', bytes: 1200 },
          { name: 'heartbeat.json', bytes: 90 },
        ],
        dirs: ['video', 'runs'],
      });
      proxy.setupDir({
        dirPath: `${HOME_DIR}/runs`,
        files: [
          { name: 'run_1.jsonl', bytes: 4000 },
          { name: 'run_1.json', bytes: 5000 },
        ],
        dirs: ['run_1'],
      });
      proxy.setupDir({
        dirPath: `${HOME_DIR}/runs/run_1`,
        files: [
          { name: 'step2.png', bytes: 51000 },
          { name: 'step1.png', bytes: 50000 },
        ],
      });
      proxy.setupDir({
        dirPath: `${HOME_DIR}/video`,
        files: [{ name: '703547507e7caf9bcbc8328daae3e4d1.webm', bytes: 860132 }],
      });

      const result = await evidenceTreeLayerBroker({
        homeDir: HOME_DIR,
        repoLocalDir: REPO_DIR,
      });

      expect(result).toStrictEqual([
        { path: `${REPO_DIR}/api-server.log`, bytes: 1200 },
        { path: `${REPO_DIR}/heartbeat.json`, bytes: 90 },
        { path: `${REPO_DIR}/runs/run_1/step1.png`, bytes: 50000 },
        { path: `${REPO_DIR}/runs/run_1/step2.png`, bytes: 51000 },
        { path: `${REPO_DIR}/runs/run_1.json`, bytes: 5000 },
        { path: `${REPO_DIR}/runs/run_1.jsonl`, bytes: 4000 },
        { path: `${REPO_DIR}/video/703547507e7caf9bcbc8328daae3e4d1.webm`, bytes: 860132 },
        { path: `${REPO_DIR}/web-server.log`, bytes: 300 },
      ]);
    });

    it('EDGE: {a subdirectory holding nothing} => lists only the files, never the empty directory', async () => {
      const proxy = evidenceTreeLayerBrokerProxy();
      proxy.setupDir({
        dirPath: HOME_DIR,
        files: [{ name: 'driver.log', bytes: 12 }],
        dirs: ['runs'],
      });
      proxy.setupDir({ dirPath: `${HOME_DIR}/runs`, files: [] });

      const result = await evidenceTreeLayerBroker({
        homeDir: HOME_DIR,
        repoLocalDir: REPO_DIR,
      });

      expect(result).toStrictEqual([{ path: `${REPO_DIR}/driver.log`, bytes: 12 }]);
    });
  });

  describe('a missing evidence directory', () => {
    it('EMPTY: {directory absent} => returns []', async () => {
      const proxy = evidenceTreeLayerBrokerProxy();
      proxy.setupMissingDir({ dirPath: HOME_DIR });

      const result = await evidenceTreeLayerBroker({
        homeDir: HOME_DIR,
        repoLocalDir: REPO_DIR,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
