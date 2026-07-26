/**
 * PURPOSE: Test setup helper for folder constraints init broker
 *
 * USAGE:
 * folderConstraintsInitBrokerProxy();
 * await folderConstraintsInitBroker();
 * // fs reads pass through to the real constraint markdown files on disk
 */
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const folderConstraintsInitBrokerProxy = (): Record<PropertyKey, never> => {
  pathResolveAdapterProxy();
  fsReadFileAdapterProxy();

  return {};
};
