import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { StatsStub } from '#gateway/node/fs/stats/stats.stub';
import { lstat } from '#gateway/node/fs__promises';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
import { isPortFreeProxy } from '#gateway/node/net/is-port-free/is-port-free.proxy';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { killProxy } from '#gateway/node/process/kill/kill.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const diskScanBrokerProxy = (): {
  setupRepoRoot: (params: { path: string; exists?: boolean }) => void;
  setupReaddir: (params: { path: string; names: string[] }) => void;
  setupReaddirMissing: (params: { path: string }) => void;
  setupLstatFile: (params: { path: string; sizeBytes?: number; mtimeMs?: number }) => void;
  setupLstatDirectory: (params: { path: string; mtimeMs?: number }) => void;
  setupLstatSymlink: (params: { path: string; sizeBytes?: number; mtimeMs?: number }) => void;
  setupLstatError: (params: { path: string; code?: string }) => void;
  setupPidAlive: (params: { pid: number }) => void;
  setupPidDead: (params: { pid: number }) => void;
  setupPortFree: (params: { port: number }) => void;
  setupPortInUse: (params: { port: number }) => void;
  setupJsonFile: (params: { path: string; data: unknown }) => void;
  setupJsonFileMissing: (params: { path: string }) => void;
  setupEnv: (params: { name: string; value: string | undefined }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readDirProxy = readdirIfExistsProxy();
  const jsonProxy = readJsonFileIfExistsProxy();
  const portProxy = isPortFreeProxy();
  const processKillProxy = killProxy();
  const envProxy = getEnvProxy();
  const lstatHandle = registerMock({ fn: lstat });

  readDirProxy.throwsMatchingPath({ path: () => true, error: FsErrorStub({ code: 'ENOENT' }) });
  jsonProxy.throwsMatchingPath({ path: () => true, error: FsErrorStub({ code: 'ENOENT' }) });

  return {
    setupEnv: ({ name, value }: { name: string; value: string | undefined }): void => {
      envProxy.setupEnv({ name, value });
    },
    setupRepoRoot: ({ path, exists = true }: { path: string; exists?: boolean }): void => {
      existsProxy.returns({ path, exists });
    },
    setupReaddir: ({ path, names }: { path: string; names: string[] }): void => {
      readDirProxy.returns({ path, names });
    },
    setupReaddirMissing: ({ path }: { path: string }): void => {
      readDirProxy.missing({ path });
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
      lstatHandle
        .calledWith([path])
        .resolves(StatsStub({ kind: 'file', sizeBytes, modifiedAtMs: mtimeMs }));
    },
    setupLstatDirectory: ({
      path,
      mtimeMs = 1_000_000,
    }: {
      path: string;
      mtimeMs?: number;
    }): void => {
      lstatHandle
        .calledWith([path])
        .resolves(StatsStub({ kind: 'directory', sizeBytes: 0, modifiedAtMs: mtimeMs }));
    },
    setupLstatSymlink: ({
      path,
      sizeBytes = 20,
      mtimeMs = 1_000_000,
    }: {
      path: string;
      sizeBytes?: number;
      mtimeMs?: number;
    }): void => {
      lstatHandle
        .calledWith([path])
        .resolves(StatsStub({ kind: 'symlink', sizeBytes, modifiedAtMs: mtimeMs }));
    },
    setupLstatError: ({ path, code = 'ENOENT' }: { path: string; code?: string }): void => {
      lstatHandle.calledWith([path]).rejects(FsErrorStub({ code, path }));
    },
    setupPidAlive: ({ pid }: { pid: number }): void => {
      processKillProxy.setupSent({ pid, signal: 0 });
    },
    setupPidDead: ({ pid }: { pid: number }): void => {
      processKillProxy.setupNotFound({ pid, signal: 0 });
    },
    setupPortFree: ({ port }: { port: number }): void => {
      portProxy.setupPortFree({ port });
    },
    setupPortInUse: ({ port }: { port: number }): void => {
      portProxy.setupPortInUse({ port });
    },
    setupJsonFile: ({ path, data }: { path: string; data: unknown }): void => {
      jsonProxy.returnsRaw({ path, rawContents: JSON.stringify(data) });
    },
    setupJsonFileMissing: ({ path }: { path: string }): void => {
      jsonProxy.missing({ path });
    },
  };
};
