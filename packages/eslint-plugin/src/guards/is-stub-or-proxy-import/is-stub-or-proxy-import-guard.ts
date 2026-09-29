/**
 * PURPOSE: Tells whether a module specifier names a stub or proxy file, in the relative form (`./quest.stub`), the per-file package form (`@dungeonmaster/shared/contracts/quest/quest.stub`) or with its extension. Reach for this over isProxyImportGuard alone when a stub counts as much as a proxy.
 *
 * USAGE:
 * isStubOrProxyImportGuard({ importSource: '@dungeonmaster/shared/contracts/quest/quest.stub' });
 * // Returns true
 * isStubOrProxyImportGuard({ importSource: '@dungeonmaster/shared/contracts' });
 * // Returns false
 */
import { isProxyImportGuard } from '../is-proxy-import/is-proxy-import-guard';
import { isStubFileGuard } from '../is-stub-file/is-stub-file-guard';

export const isStubOrProxyImportGuard = ({
  importSource,
}: {
  importSource?: string | undefined;
}): boolean => {
  if (importSource === undefined) {
    return false;
  }

  return isProxyImportGuard({ importSource }) || isStubFileGuard({ filename: importSource });
};
