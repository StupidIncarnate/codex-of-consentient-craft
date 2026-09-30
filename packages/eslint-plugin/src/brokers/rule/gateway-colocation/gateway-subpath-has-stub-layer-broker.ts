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
import { readdirEntriesSync } from '#gateway/node/fs';

const STUB_FILE_SUFFIX = '.stub.ts';

export const gatewaySubpathHasStubLayerBroker = ({
  subpathDirectory,
}: {
  subpathDirectory: string;
}): boolean =>
  readdirEntriesSync(subpathDirectory).some((entry) =>
    entry.kind === 'directory'
      ? gatewaySubpathHasStubLayerBroker({
          subpathDirectory: `${subpathDirectory}${entry.name}/`,
        })
      : entry.name.endsWith(STUB_FILE_SUFFIX),
  );
