/**
 * PURPOSE: Builds a startup-annotation Map for a cli-tool package — for each bin entry in
 * package.json, resolves the startup file it points to and emits a `[bin: <bin-name>]`
 * suffix keyed by the startup file path.
 *
 * USAGE:
 * const annotations = cliBinToAnnotationsLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/ward'),
 * });
 * // Returns ResponderAnnotationMap keyed by startup file path
 *
 * WHEN-TO-USE: Inside architecture-responder-annotations-broker for cli-tool packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import {
  responderAnnotationMapContract,
  type ResponderAnnotationMap,
} from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
import type { ResponderAnnotation } from '../../../contracts/responder-annotation/responder-annotation-contract';
import { hookStartupSrcPathResolveTransformer } from '../../../transformers/hook-startup-src-path-resolve/hook-startup-src-path-resolve-transformer';
import { readPackageJsonLayerBroker } from './read-package-json-layer-broker';

export const cliBinToAnnotationsLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ResponderAnnotationMap => {
  const result = new Map<AbsoluteFilePath, ResponderAnnotation>();
  const pkgJson = readPackageJsonLayerBroker({ packageRoot });

  if (pkgJson === undefined) {
    return responderAnnotationMapContract.parse(result);
  }

  const rawBin = pkgJson.bin;
  if (rawBin === undefined) {
    return responderAnnotationMapContract.parse(result);
  }

  // Normalize string-bin form into a single-entry record so the loop below handles both shapes.
  const binEntries: { binName: ContentText; binPath: ContentText }[] = [];
  if (typeof rawBin === 'string') {
    const pkgName = pkgJson.name === undefined ? '(unknown-bin)' : String(pkgJson.name);
    const lastSlash = pkgName.lastIndexOf('/');
    const binName = lastSlash === -1 ? pkgName : pkgName.slice(lastSlash + 1);
    binEntries.push({
      binName: contentTextContract.parse(binName),
      binPath: contentTextContract.parse(rawBin),
    });
  } else {
    for (const [binName, binPath] of Object.entries(rawBin)) {
      binEntries.push({
        binName: contentTextContract.parse(binName),
        binPath: contentTextContract.parse(String(binPath)),
      });
    }
  }

  for (const { binName, binPath } of binEntries) {
    const startupPath = hookStartupSrcPathResolveTransformer({ binPath, packageRoot });
    if (startupPath === undefined) continue;
    const suffix = contentTextContract.parse(`[bin: ${String(binName)}]`);
    result.set(startupPath, { suffix, childLines: [] });
  }

  return responderAnnotationMapContract.parse(result);
};
