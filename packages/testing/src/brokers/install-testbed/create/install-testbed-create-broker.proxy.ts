/**
 * PURPOSE: Empty proxy for install-testbed-create-broker
 *
 * USAGE:
 * const proxy = installTestbedCreateBrokerProxy();
 * // Empty proxy - broker uses real fs/path/execSync for integration testing
 */

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { cryptoRandomBytesAdapterProxy } from '../../../adapters/crypto/random-bytes/crypto-random-bytes-adapter.proxy';
import { childProcessExecSyncAdapterProxy } from '../../../adapters/child-process/exec-sync/child-process-exec-sync-adapter.proxy';

export const installTestbedCreateBrokerProxy = (): Record<PropertyKey, never> => {
  fsWriteFileAdapterProxy();
  fsReadFileAdapterProxy();
  fsExistsAdapterProxy();
  fsMkdirAdapterProxy();
  fsRmAdapterProxy();
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();
  pathResolveAdapterProxy();
  cryptoRandomBytesAdapterProxy();
  childProcessExecSyncAdapterProxy();

  return {};
};
