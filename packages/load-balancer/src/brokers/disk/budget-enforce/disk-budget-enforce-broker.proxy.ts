import type { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { realpathProxy } from '#gateway/node/fs__promises/realpath/realpath.proxy';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { dirname } from '#gateway/node/path';
import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { DiskItem } from '../../../contracts/disk-item/disk-item-contract';
import { diskScanBroker } from '../scan/disk-scan-broker';
import { diskScanBrokerProxy } from '../scan/disk-scan-broker.proxy';
import { limitsReadBroker } from '../../limits/read/limits-read-broker';
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

export const diskBudgetEnforceBrokerProxy = ({
  homeDir = MOCK_HOME,
}: {
  homeDir?: string;
} = {}): {
  setupDatabase: (params?: { database?: DatabaseSync; homeDir?: string }) => {
    database: DatabaseSync;
  };
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
  setupThrows: (params: { error: Error }) => void;
  setupScannedItems: (params: { items: readonly DiskItem[]; maxDiskMB?: number }) => void;
} => {
  const limitsProxy = limitsReadBrokerProxy();
  const registryOpenProxy = registryOpenBrokerProxy();
  const scanProxy = diskScanBrokerProxy();
  const realPathProxy = realpathProxy();
  const rmGatewayProxy = rmProxy();

  const database = DatabaseSyncStub();
  initSchema(database);

  const realScan = requireActual<{ diskScanBroker: typeof diskScanBroker }>({
    module: '../scan/disk-scan-broker',
  });
  const scanHandle = registerMock({ fn: diskScanBroker });
  scanHandle
    .calledWith([{ repoRoots: () => true }])
    .implement(async (...args: unknown[]) =>
      realScan.diskScanBroker(...(args as unknown as Parameters<typeof diskScanBroker>)),
    );

  const limitsHandle = registerMock({ fn: limitsReadBroker });
  limitsHandle.calledWith([]).resolves({
    resources: { maxDiskMB: 4096, maxMemoryPercent: 80 },
    guildPaths: [],
    warning: null,
  });

  limitsProxy.setupHomeDir({ homeDir });
  registryOpenProxy.setupHomeDir({ homeDir });
  registryOpenProxy.setupEnv({ name: 'DUNGEONMASTER_LOAD_DIR', value: undefined });
  registryOpenProxy.setupDatabase({
    filePath: `${homeDir}/.dungeonmaster/load/registry-v1.db`,
    database,
  });

  limitsProxy.setupValidConfig({
    homeDir,
    resources: { maxDiskMB: 4096, maxMemoryPercent: 80 },
    guilds: [],
  });

  return {
    setupDatabase: (params?: {
      database?: DatabaseSync;
      homeDir?: string;
    }): { database: DatabaseSync } => {
      const db = params?.database ?? database;
      initSchema(db);
      const targetHome = params?.homeDir ?? homeDir;
      registryOpenProxy.setupHomeDir({ homeDir: targetHome });
      registryOpenProxy.setupDatabase({
        filePath: `${targetHome}/.dungeonmaster/load/registry-v1.db`,
        database: db,
      });
      if (targetHome !== '/home/user') {
        registryOpenProxy.setupDatabase({
          filePath: '/home/user/.dungeonmaster/load/registry-v1.db',
          database: db,
        });
      }
      return { database: db };
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
        homeDir,
        resources: { maxDiskMB, maxMemoryPercent: 80 },
        guilds: guildPaths.map((p) => ({ path: p })),
      });
      limitsHandle.calledWith([]).resolves({
        resources: { maxDiskMB, maxMemoryPercent: 80 },
        guildPaths: guildPaths.map((p) => ({ path: p })),
        warning: null,
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
    setupThrows: ({ error }: { error: Error }): void => {
      scanHandle.calledWith([{ repoRoots: () => true }]).rejects(error);
    },
    setupScannedItems: ({
      items,
      maxDiskMB,
    }: {
      items: readonly DiskItem[];
      maxDiskMB?: number;
    }): void => {
      if (maxDiskMB !== undefined) {
        limitsProxy.setupValidConfig({
          homeDir,
          resources: { maxDiskMB, maxMemoryPercent: 80 },
          guilds: [],
        });
        limitsHandle.calledWith([]).resolves({
          resources: { maxDiskMB, maxMemoryPercent: 80 },
          guildPaths: [],
          warning: null,
        });
      }
      for (const item of items) {
        const parent = dirname(item.path);
        realPathProxy.returns({ path: parent, resolved: parent });
        realPathProxy.returns({ path: item.path, resolved: item.path });
        rmGatewayProxy.succeeds({ path: item.path });
      }
      scanHandle
        .calledWith([{ repoRoots: () => true }])
        .resolves({ items: [...items], skipped: 0 });
    },
  };
};
