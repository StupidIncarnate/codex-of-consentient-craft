/**
 * PURPOSE: Recursively enumerates every non-test `.ts`/`.tsx` source file under each
 * walked folder type (adapters, bindings, brokers, flows, middleware, migrations,
 * responders, startup, state, widgets) inside a package's src/. Missing folder types
 * are silently skipped — different package types contain different subsets.
 *
 * USAGE:
 * const files = listWalkedFolderFilesLayerBroker({
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 * });
 * // Returns AbsoluteFilePath[] of every implementation file in any walked folder type
 *
 * WHEN-TO-USE: orphan-detect broker computing the candidate-set against which the
 * reachability walk's `visited` set is compared to surface unreferenced files.
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { architectureOrphanDetectStatics } from '../../../statics/architecture-orphan-detect/architecture-orphan-detect-statics';

const TS_SUFFIX = '.ts';
const TSX_SUFFIX = '.tsx';

export const listWalkedFolderFilesLayerBroker = ({
  packageSrcPath,
}: {
  packageSrcPath: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const stack: AbsoluteFilePath[] = [];
  for (const folderType of architectureOrphanDetectStatics.walkedFolderTypes) {
    stack.push(absoluteFilePathContract.parse(`${String(packageSrcPath)}/${folderType}`));
  }

  const results: AbsoluteFilePath[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;

    const entries = safeReaddirLayerBroker({ dirPath: current });
    for (const entry of entries) {
      const entryPath = absoluteFilePathContract.parse(`${String(current)}/${entry.name}`);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }
      if (!entry.name.endsWith(TS_SUFFIX) && !entry.name.endsWith(TSX_SUFFIX)) continue;
      if (!isNonTestFileGuard({ filePath: entryPath })) continue;
      results.push(entryPath);
    }
  }

  return results;
};
