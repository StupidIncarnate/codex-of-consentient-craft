/**
 * PURPOSE: Proxy for integration-environment-create-broker — every fs gateway call the broker
 * makes is staged: a path answers "does not exist" until a test says otherwise, writes and
 * directory creation succeed, and each scenario method reads back what the broker asked the
 * gateway to do.
 *
 * USAGE:
 * const proxy = integrationEnvironmentCreateBrokerProxy();
 * const guild = integrationEnvironmentCreateBroker({ baseName });
 * proxy.setupPathExists({ path: `${guild.guildPath}/notes.txt` });
 * proxy.setupUnlinkSucceeds({ path: `${guild.guildPath}/notes.txt` });
 * guild.deleteFile({ fileName });
 * proxy.getUnlinkCalls({ path: `${guild.guildPath}/notes.txt` });
 * // Returns [[`${guild.guildPath}/notes.txt`]]
 */

import { ensureDirSyncProxy } from '#gateway/node/fs/ensure-dir-sync/ensure-dir-sync.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { rmSyncProxy } from '#gateway/node/fs/rm-sync/rm-sync.proxy';
import { unlinkSyncProxy } from '#gateway/node/fs/unlink-sync/unlink-sync.proxy';
import { writeFileSyncProxy } from '#gateway/node/fs/write-file-sync/write-file-sync.proxy';
import { randomBytes } from 'crypto';
import { runSyncProxy } from '#gateway/node/child_process/run-sync/run-sync.proxy';
import { registerMock } from '../../../register-mock';
import { integrationEnvironmentStatics } from '../../../statics/integration-environment/integration-environment-statics';
import { integrationEnvironmentTrackingBrokerProxy } from '../tracking/integration-environment-tracking-broker.proxy';

const isPath = (candidate: unknown): boolean => typeof candidate === 'string';

export const integrationEnvironmentCreateBrokerProxy = (): {
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
  setupUnlinkSucceeds: ({ path }: { path: string }) => void;
  getWrittenContents: ({ path }: { path: string }) => unknown;
  getUnlinkCalls: ({ path }: { path: string }) => unknown[][];
  getRemoveCalls: ({ path }: { path: string }) => unknown[][];
} => {
  ensureDirSyncProxy();
  const writeFileProxy = writeFileSyncProxy();
  const readFileProxy = readFileSyncProxy();
  const readdirProxy = readdirSyncProxy();
  const rmProxy = rmSyncProxy();
  const unlinkProxy = unlinkSyncProxy();
  const existsProxy = existsSyncProxy();
  const randomBytesHandle = registerMock({ fn: randomBytes });
  const commandProxy = runSyncProxy();
  integrationEnvironmentTrackingBrokerProxy();

  // Staged before any exact path: a predicate and an exact path score the same and the later
  // staging wins, so every path a test names outranks this "not there" default.
  existsProxy.returnsMatchingPath({ path: isPath, exists: false });

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
    setupUnlinkSucceeds: ({ path }: { path: string }): void => {
      unlinkProxy.succeeds({ path });
    },
    getWrittenContents: ({ path }: { path: string }): unknown =>
      writeFileProxy.writtenContents({ path }),
    getUnlinkCalls: ({ path }: { path: string }): unknown[][] => unlinkProxy.calls({ path }),
    getRemoveCalls: ({ path }: { path: string }): unknown[][] => rmProxy.calls({ path }),
  };
};
