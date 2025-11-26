/**
 * PURPOSE: Empty proxy for integration-environment-create-broker
 *
 * USAGE:
 * const proxy = integrationEnvironmentCreateBrokerProxy();
 * // Empty proxy - broker uses real fs/path/execSync for integration testing
 */

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { cryptoRandomBytesAdapterProxy } from '../../../adapters/crypto/random-bytes/crypto-random-bytes-adapter.proxy';
import { childProcessExecSyncAdapterProxy } from '../../../adapters/child-process/exec-sync/child-process-exec-sync-adapter.proxy';
import { integrationEnvironmentTrackingBrokerProxy } from '../tracking/integration-environment-tracking-broker.proxy';

export const integrationEnvironmentCreateBrokerProxy = (): Record<PropertyKey, never> => {
  fsWriteFileAdapterProxy();
  fsReadFileAdapterProxy();
  fsExistsAdapterProxy();
  fsMkdirAdapterProxy();
  fsRmAdapterProxy();
  fsReaddirAdapterProxy();
  fsUnlinkAdapterProxy();
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();
  cryptoRandomBytesAdapterProxy();
  childProcessExecSyncAdapterProxy();
  integrationEnvironmentTrackingBrokerProxy();

  return {};
};
