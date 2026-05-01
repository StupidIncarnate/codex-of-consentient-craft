/**
 * PURPOSE: Renders the Hooks table and Detailed exemplar sections for a hook-handlers
 * package in the project-map connection-graph view. For each bin entry in package.json,
 * traces startup → flow → responder, detecting spawn and fs-write annotations. The exemplar
 * traces the first bin entry end-to-end: stdin JSON event → startup → flow → responder → exit code.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineHookHandlersBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/hooks'),
 * });
 * // Returns ContentText markdown with ## Hooks and ## Detailed exemplar sections
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as hook-handlers type
 * WHEN-NOT-TO-USE: For non-hook-handlers packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { hookStartupSrcPathResolveTransformer } from '../../../transformers/hook-startup-src-path-resolve/hook-startup-src-path-resolve-transformer';
import { readPackageJsonLayerBroker } from './read-package-json-layer-broker';
import { readSourceLayerBroker } from './read-source-layer-broker';
import { hooksSectionRenderLayerBroker } from './hooks-section-render-layer-broker';
import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';

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

  if (binEntries.length === 0) {
    return contentTextContract.parse(`${String(hooksSection)}\n\n---`);
  }

  // Find the first bin entry that has a readable startup file for the exemplar
  const exemplarEntry = binEntries.find(({ binPath }) => {
    const startupPath = hookStartupSrcPathResolveTransformer({ binPath, packageRoot });
    return (
      startupPath !== undefined && readSourceLayerBroker({ filePath: startupPath }) !== undefined
    );
  });

  if (exemplarEntry === undefined) {
    return contentTextContract.parse(`${String(hooksSection)}\n\n---`);
  }

  const startupPath = hookStartupSrcPathResolveTransformer({
    binPath: exemplarEntry.binPath,
    packageRoot,
  });

  if (startupPath === undefined) {
    return contentTextContract.parse(`${String(hooksSection)}\n\n---`);
  }

  const startupSource = readSourceLayerBroker({ filePath: startupPath });

  if (startupSource === undefined) {
    return contentTextContract.parse(`${String(hooksSection)}\n\n---`);
  }

  const exemplarSection = exemplarSectionRenderLayerBroker({
    binName: exemplarEntry.binName,
    startupSource,
    packageRoot,
  });

  return contentTextContract.parse(`${String(hooksSection)}\n\n---\n\n${String(exemplarSection)}`);
};
