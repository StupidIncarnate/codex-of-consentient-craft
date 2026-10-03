import type { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { realpathProxy } from '#gateway/node/fs__promises/realpath/realpath.proxy';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { dirname } from '#gateway/node/path';
import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { diskScanBrokerProxy } from '../scan/disk-scan-broker.proxy';
import { limitsReadBrokerProxy } from '../../limits/read/limits-read-broker.proxy';
import { registryOpenBrokerProxy } from '../../registry/open/registry-open-broker.proxy';

type DatabaseSync = ReturnType<typeof DatabaseSyncStub>;
type FsError = ReturnType<typeof FsErrorStub>;

const MOCK_HOME = '/mock/home';

const initSchema = (database: DatabaseSync): void => {
  database.exec(
    'CREATE TABLE IF NOT EXISTS durations (repo_root TEXT, package TEXT, check_type TEXT, duration_ms INTEGER, peak_rss_mb INTEGER NULL, shards INTEGER NULL, recorded_at_ms INTEGER);',
  );
  database.exec(
    'CREATE INDEX IF NOT EXISTS idx_durations_lookup ON durations (repo_root, package, check_type, recorded_at_ms);',
  );
  database.exec(
    'CREATE TABLE IF NOT EXISTS leases (lease_id TEXT PRIMARY KEY, tool TEXT, label TEXT, owner_pid INTEGER, state TEXT, expected_peak_mb INTEGER NULL, current_rss_mb INTEGER NULL, started_at_ms INTEGER, last_beat_ms INTEGER);',
  );
  database.exec('CREATE INDEX IF NOT EXISTS idx_leases_tool_state ON leases (tool, state);');
  database.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);');
};

export const diskBudgetEnforceBrokerProxy = (): {
  setupDatabase: (params?: { homeDir?: string }) => { database: DatabaseSync };
  setLastRunMs: (params: { lastRunMs: number }) => void;
  getLastRunMs: () => number | null;
  setupLimits: (params: { maxDiskMB?: number; guildPaths?: readonly string[] }) => void;
  setupRepoRoot: (params: { path: string; exists?: boolean }) => void;
  setupReaddir: (params: { path: string; names: string[] }) => void;
  setupLstatFile: (params: { path: string; sizeBytes?: number; mtimeMs?: number }) => void;
  setupLstatDirectory: (params: { path: string; mtimeMs?: number }) => void;
  setupSafeRealpath: (params: { path: string }) => void;
  setupUnsafeRealpath: (params: { path: string; targetPath: string }) => void;
  setupRm: (params: { path: string }) => void;
  setupRmError: (params: { path: string; error: FsError }) => void;
  getRmCallsFor: (params: { path: string }) => readonly unknown[][];
} => {
  const limitsProxy = limitsReadBrokerProxy();
  const registryOpenProxy = registryOpenBrokerProxy();
  const scanProxy = diskScanBrokerProxy();
  const realPathProxy = realpathProxy();
  const rmGatewayProxy = rmProxy();

  const database = DatabaseSyncStub();
  initSchema(database);

  limitsProxy.setupHomeDir({ homeDir: MOCK_HOME });
  registryOpenProxy.setupHomeDir({ homeDir: MOCK_HOME });
  registryOpenProxy.setupEnv({ name: 'DUNGEONMASTER_LOAD_DIR', value: undefined });
  registryOpenProxy.setupDatabase({
    filePath: `${MOCK_HOME}/.dungeonmaster/load/registry-v1.db`,
    database,
  });

  limitsProxy.setupValidConfig({
    homeDir: MOCK_HOME,
    resources: { maxDiskMB: 4096, maxMemoryPercent: 80 },
    guilds: [],
  });

  return {
    setupDatabase: (params?: { homeDir?: string }): { database: DatabaseSync } => {
      const homeDir = params?.homeDir ?? MOCK_HOME;
      registryOpenProxy.setupHomeDir({ homeDir });
      registryOpenProxy.setupDatabase({
        filePath: `${homeDir}/.dungeonmaster/load/registry-v1.db`,
        database,
      });
      return { database };
    },
    setLastRunMs: ({ lastRunMs }: { lastRunMs: number }): void => {
      database
        .prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);')
        .run('diskBudgetLastRunMs', String(lastRunMs));
    },
    getLastRunMs: (): number | null => {
      const row = database
        .prepare('SELECT value FROM meta WHERE key = ?;')
        .get('diskBudgetLastRunMs');
      if (row !== undefined && typeof row.value === 'string') {
        return Number(row.value);
      }
      return null;
    },
    setupLimits: ({
      maxDiskMB = 4096,
      guildPaths = [],
    }: {
      maxDiskMB?: number;
      guildPaths?: readonly string[];
    }): void => {
      limitsProxy.setupValidConfig({
        homeDir: MOCK_HOME,
        resources: { maxDiskMB, maxMemoryPercent: 80 },
        guilds: guildPaths.map((p) => ({ path: p })),
      });
    },
    setupRepoRoot: ({ path, exists = true }: { path: string; exists?: boolean }): void => {
      scanProxy.setupRepoRoot({ path, exists });
    },
    setupReaddir: ({ path, names }: { path: string; names: string[] }): void => {
      scanProxy.setupReaddir({ path, names });
    },
    setupLstatFile: ({
      path,
      sizeBytes = 100,
      mtimeMs = 1_000_000,
    }: {
      path: string;
      sizeBytes?: number;
      mtimeMs?: number;
    }): void => {
      scanProxy.setupLstatFile({ path, sizeBytes, mtimeMs });
    },
    setupLstatDirectory: ({
      path,
      mtimeMs = 1_000_000,
    }: {
      path: string;
      mtimeMs?: number;
    }): void => {
      scanProxy.setupLstatDirectory({ path, mtimeMs });
    },
    setupSafeRealpath: ({ path }: { path: string }): void => {
      const parent = dirname(path);
      realPathProxy.returns({ path: parent, resolved: parent });
      realPathProxy.returns({ path, resolved: path });
    },
    setupUnsafeRealpath: ({ path, targetPath }: { path: string; targetPath: string }): void => {
      const parent = dirname(path);
      realPathProxy.returns({ path: parent, resolved: parent });
      realPathProxy.returns({ path, resolved: targetPath });
    },
    setupRm: ({ path }: { path: string }): void => {
      rmGatewayProxy.succeeds({ path });
    },
    setupRmError: ({ path, error }: { path: string; error: FsError }): void => {
      rmGatewayProxy.rejects({ path, error });
    },
    getRmCallsFor: ({ path }: { path: string }): readonly unknown[][] =>
      rmGatewayProxy.getCallsFor({ path }),
  };
};
