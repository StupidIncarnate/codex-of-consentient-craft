/**
 * PURPOSE: Walks a gateway subpath's own directory tree, recursively, for at least one WRAPPER
 * file — a single-dot `.ts` file that is not the subpath's own barrel. `gateway-colocation`'s
 * `requireStub` option asks for a stub only when this answers true: a barrel-only subpath
 * (`export * from 'left-pad';` plus its test) adds nothing to stub, while a subpath carrying its
 * own wrapper does. `.test.ts`, `.proxy.ts`, `.stub.ts`, `.d.ts`, `.harness.ts` and `.error.ts`
 * all carry a second dot, so the dot count alone leaves them out.
 *
 * USAGE:
 * gatewaySubpathHasWrapperLayerBroker({
 *   subpathDirectory: '/repo/packages/@gateway/node/src/fs/',
 *   barrelFileName: 'fs.ts',
 * });
 * // Returns true once any file under that directory, other than the top-level `fs.ts`, is a
 * // single-dot `.ts` file
 */
import { readdirEntriesSync } from '#gateway/node/fs';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';

const WRAPPER_FILE_SUFFIX = '.ts';
const WRAPPER_FILE_DOT_COUNT = 1;

export const gatewaySubpathHasWrapperLayerBroker = ({
  subpathDirectory,
  barrelFileName,
}: {
  subpathDirectory: string;
  barrelFileName?: string;
}): boolean =>
  readdirEntriesSync(subpathDirectory).some((entry) =>
    entry.kind === 'directory'
      ? gatewaySubpathHasWrapperLayerBroker({
          subpathDirectory: `${subpathDirectory}${entry.name}/`,
        })
      : entry.name.endsWith(WRAPPER_FILE_SUFFIX) &&
        dotCountTransformer({ str: entry.name }) === WRAPPER_FILE_DOT_COUNT &&
        entry.name !== barrelFileName,
  );
