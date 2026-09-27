/**
 * PURPOSE: Tells whether a gateway file is a subpath's barrel — the file named after its own folder,
 * directly under `src/` (`src/fs/fs.ts`, `src/fs__promises/fs__promises.ts`). A wrapper named after
 * its subpath sits one folder deeper (`src/glob/glob/glob.ts`), so it is never mistaken for one.
 * `gatewayReservedFolderNamesStatics.folders.testSupport` is excluded even when a future file inside
 * it happens to match its own folder's name — that folder holds shared proxy-addressing types
 * (`ArgMatcher`, `ValueMatcher`, `PathMatcher`), never a subpath with wrapper folders of its own.
 * Pair with isGatewayFileGuard, which answers whether the file is in the gateway at all.
 *
 * USAGE:
 * isGatewayBarrelFileGuard({ filename: '/repo/packages/@gateway/node/src/fs/fs.ts' });
 * // Returns true
 * isGatewayBarrelFileGuard({ filename: '/repo/packages/@gateway/npm/src/glob/glob/glob.ts' });
 * // Returns false
 */
import { gatewayReservedFolderNamesStatics } from '../../statics/gateway-reserved-folder-names/gateway-reserved-folder-names-statics';

export const isGatewayBarrelFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  const [fileName, folderName, parentFolderName] = filename.split('/').reverse();

  if (folderName === gatewayReservedFolderNamesStatics.folders.testSupport) {
    return false;
  }

  return (
    parentFolderName === 'src' &&
    (fileName === `${folderName}.ts` || fileName === `${folderName}.tsx`)
  );
};
