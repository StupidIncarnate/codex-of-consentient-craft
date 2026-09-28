/**
 * PURPOSE: Proxy for install-testbed-create-broker — every fs gateway call the broker makes is
 * staged: a path answers "does not exist" until a test says otherwise, writes and directory creation
 * succeed, and each scenario method reads back what the broker asked the gateway to do.
 *
 * USAGE:
 * const proxy = installTestbedCreateBrokerProxy();
 * const testbed = installTestbedCreateBroker({ baseName });
 * proxy.setupPathExists({ path: testbed.guildPath });
 * proxy.setupRemoveSucceeds({ path: testbed.guildPath });
 * testbed.cleanup();
 * proxy.getRemoveCalls({ path: testbed.guildPath });
 * // Returns [[guildPath, { recursive: true, force: true }]]
 */

import { ensureDirSyncProxy } from '#gateway/node/fs/ensure-dir-sync/ensure-dir-sync.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { rmSyncProxy } from '#gateway/node/fs/rm-sync/rm-sync.proxy';
import { symlinkSyncProxy } from '#gateway/node/fs/symlink-sync/symlink-sync.proxy';
import { writeFileSyncProxy } from '#gateway/node/fs/write-file-sync/write-file-sync.proxy';
import { randomBytes } from 'crypto';
import { runSyncProxy } from '#gateway/node/child_process/run-sync/run-sync.proxy';
import { registerMock } from '../../../register-mock';
import { integrationEnvironmentStatics } from '../../../statics/integration-environment/integration-environment-statics';
import { findRepoRootLayerBrokerProxy } from './find-repo-root-layer-broker.proxy';

export const installTestbedCreateBrokerProxy = (): {
  setupRandomBytes: ({ bytes }: { bytes: Buffer }) => void;
  setupCommandSucceeds: ({ command, stdout }: { command: string; stdout: string }) => void;
  setupCommandExits: ({
    command,
    status,
    stdout,
    stderr,
  }: {
    command: string;
    status: number;
    stdout: string;
    stderr: string;
  }) => void;
  setupCommandNotFound: ({ command, code }: { command: string; code: string }) => void;
  setupPathExists: ({ path }: { path: string }) => void;
  setupFileContents: ({ path, contents }: { path: string; contents: string }) => void;
  setupDirEntries: ({ path, names }: { path: string; names: string[] }) => void;
  setupRemoveSucceeds: ({ path }: { path: string }) => void;
  setupSymlinkSucceeds: ({ target, path }: { target: string; path: string }) => void;
  getWrittenContents: ({ path }: { path: string }) => unknown;
  getEnsuredDirCalls: ({ path }: { path: string }) => unknown[][];
  getRemoveCalls: ({ path }: { path: string }) => unknown[][];
  getSymlinkCalls: ({ target, path }: { target: string; path: string }) => unknown[][];
} => {
  const ensureDirProxy = ensureDirSyncProxy();
  const writeFileProxy = writeFileSyncProxy();
  const readFileProxy = readFileSyncProxy();
  const readdirProxy = readdirSyncProxy();
  const rmProxy = rmSyncProxy();
  const symlinkProxy = symlinkSyncProxy();
  const randomBytesHandle = registerMock({ fn: randomBytes });
  const commandProxy = runSyncProxy();
  // Stages the "does not exist" default for every path, plus this package's own repo root.
  findRepoRootLayerBrokerProxy();
  const existsProxy = existsSyncProxy();

  return {
    setupRandomBytes: ({ bytes }: { bytes: Buffer }): void => {
      randomBytesHandle
        .calledWith([integrationEnvironmentStatics.constants.randomBytesLength])
        .returns(bytes);
    },
    setupCommandSucceeds: ({ command, stdout }: { command: string; stdout: string }): void => {
      commandProxy.setupSuccess({ command, stdout });
    },
    setupCommandExits: ({
      command,
      status,
      stdout,
      stderr,
    }: {
      command: string;
      status: number;
      stdout: string;
      stderr: string;
    }): void => {
      commandProxy.setupNonZeroExit({ command, status, stdout, stderr });
    },
    setupCommandNotFound: ({ command, code }: { command: string; code: string }): void => {
      commandProxy.setupNotFound({ command, code, message: `spawn ${command} ${code}` });
    },
    setupPathExists: ({ path }: { path: string }): void => {
      existsProxy.returns({ path, exists: true });
    },
    setupFileContents: ({ path, contents }: { path: string; contents: string }): void => {
      existsProxy.returns({ path, exists: true });
      readFileProxy.returns({ path, contents });
    },
    setupDirEntries: ({ path, names }: { path: string; names: string[] }): void => {
      existsProxy.returns({ path, exists: true });
      readdirProxy.returns({ path, names });
    },
    setupRemoveSucceeds: ({ path }: { path: string }): void => {
      rmProxy.succeeds({ path });
    },
    setupSymlinkSucceeds: ({ target, path }: { target: string; path: string }): void => {
      symlinkProxy.succeeds({ target, path });
    },
    getWrittenContents: ({ path }: { path: string }): unknown =>
      writeFileProxy.writtenContents({ path }),
    getEnsuredDirCalls: ({ path }: { path: string }): unknown[][] => ensureDirProxy.calls({ path }),
    getRemoveCalls: ({ path }: { path: string }): unknown[][] => rmProxy.calls({ path }),
    getSymlinkCalls: ({ target, path }: { target: string; path: string }): unknown[][] =>
      symlinkProxy.calls({ target, path }),
  };
};
