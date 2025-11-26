/**
 * PURPOSE: Empty proxy for import-path-resolver-middleware
 * Uses real fs operations for integration testing
 */

import { pathDirnameAdapterProxy } from '../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathResolveAdapterProxy } from '../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';

export const importPathResolverMiddlewareProxy = (): Record<PropertyKey, never> => {
  pathDirnameAdapterProxy();
  pathResolveAdapterProxy();
  fsExistsSyncAdapterProxy();

  return {};
};
