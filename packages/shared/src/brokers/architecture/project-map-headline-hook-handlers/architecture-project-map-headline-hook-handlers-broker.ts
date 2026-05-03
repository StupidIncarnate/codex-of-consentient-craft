/**
 * PURPOSE: Renders the Hooks table section for a hook-handlers package in the
 * project-map connection-graph view. For each bin entry in package.json, traces
 * startup → flow → responder, detecting spawn and fs-write annotations.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineHookHandlersBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/hooks'),
 * });
 * // Returns ContentText markdown with ## Hooks section
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as hook-handlers type
 * WHEN-NOT-TO-USE: For non-hook-handlers packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { readPackageJsonLayerBroker } from './read-package-json-layer-broker';
import { hooksSectionRenderLayerBroker } from './hooks-section-render-layer-broker';

export const architectureProjectMapHeadlineHookHandlersBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const pkgJson = readPackageJsonLayerBroker({ packageRoot });

  const rawBin = pkgJson?.bin;

  const binEntries =
    rawBin === undefined || typeof rawBin === 'string'
      ? []
      : Object.entries(rawBin).map(([binName, binPath]) => ({
          binName: contentTextContract.parse(binName),
          binPath: contentTextContract.parse(String(binPath)),
        }));

  const hooksSection = hooksSectionRenderLayerBroker({ binEntries, packageRoot });

  return contentTextContract.parse(`${String(hooksSection)}\n\n---`);
};
