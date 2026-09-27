/**
 * PURPOSE: Walks a gateway subpath's own directory tree, recursively, for at least one `.stub.ts`
 * file anywhere under it — the shape `gateway-colocation`'s `requireStub` option needs to answer
 * "does this subpath ship a stub" without hand-listing every wrapper folder inside it. A subpath
 * with no wrapper folders of its own (a single-file barrel like `setTimeout.ts`) still passes
 * through here once, since the barrel's own directory IS the whole subpath.
 *
 * USAGE:
 * gatewaySubpathHasStubLayerBroker({ subpathDirectory: filePathContract.parse('/repo/packages/@gateway/node/src/fs/') });
 * // Returns true once any file anywhere under that directory ends in `.stub.ts`
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReaddirSyncAdapter } from '../../../adapters/fs/readdir-sync/fs-readdir-sync-adapter';

const STUB_FILE_SUFFIX = '.stub.ts';

export const gatewaySubpathHasStubLayerBroker = ({
  subpathDirectory,
}: {
  subpathDirectory: FilePath;
}): boolean =>
  fsReaddirSyncAdapter({ dirPath: subpathDirectory }).some((entry) =>
    entry.isDirectory
      ? gatewaySubpathHasStubLayerBroker({
          subpathDirectory: filePathContract.parse(`${subpathDirectory}${entry.name}/`),
        })
      : entry.name.endsWith(STUB_FILE_SUFFIX),
  );
