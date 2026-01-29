/**
 * PURPOSE: Test proxy for e2eConfigSetupBroker
 *
 * USAGE:
 * const proxy = e2eConfigSetupBrokerProxy();
 * // Empty proxy - broker uses real fs for integration testing
 */

import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const e2eConfigSetupBrokerProxy = (): Record<PropertyKey, never> => {
  fsExistsAdapterProxy();
  fsWriteFileAdapterProxy();
  fsMkdirAdapterProxy();
  pathJoinAdapterProxy();

  return {};
};
