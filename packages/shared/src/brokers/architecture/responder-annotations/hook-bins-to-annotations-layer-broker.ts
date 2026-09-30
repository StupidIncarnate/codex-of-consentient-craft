/**
 * PURPOSE: Builds a startup-annotation Map for a hook-handlers package — for each bin entry
 * in package.json, resolves the startup file it points to and emits a `[hook: <bin-name>]`
 * suffix keyed by the startup file path.
 *
 * USAGE:
 * const annotations = hookBinsToAnnotationsLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/hooks'),
 * });
 * // Returns ResponderAnnotationMap keyed by startup file path
 *
 * WHEN-TO-USE: Inside architecture-responder-annotations-broker for hook-handlers packages
 */

import {
  responderAnnotationMapContract,
  type ResponderAnnotationMap,
} from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
import type { ResponderAnnotation } from '../../../contracts/responder-annotation/responder-annotation-contract';
import { hookStartupSrcPathResolveTransformer } from '../../../transformers/hook-startup-src-path-resolve/hook-startup-src-path-resolve-transformer';
import { readPackageJsonLayerBroker } from './read-package-json-layer-broker';
import { responderAnnotationContract } from '../../../contracts/responder-annotation/responder-annotation-contract';

export const hookBinsToAnnotationsLayerBroker = ({
  packageRoot,
}: {
  packageRoot: string;
}): ResponderAnnotationMap => {
  const result = new Map<string, ResponderAnnotation>();
  const pkgJson = readPackageJsonLayerBroker({ packageRoot });

  if (pkgJson === undefined) {
    return responderAnnotationMapContract.parse(result);
  }

  const rawBin = pkgJson.bin;
  if (rawBin === undefined || typeof rawBin === 'string') {
    return responderAnnotationMapContract.parse(result);
  }

  for (const [binName, binPath] of Object.entries(rawBin)) {
    const startupPath = hookStartupSrcPathResolveTransformer({
      binPath: String(binPath),
      packageRoot,
    });
    if (startupPath === undefined) continue;

    const suffix: string = `[hook: ${binName}]`;
    result.set(startupPath, responderAnnotationContract.parse({ suffix, childLines: [] }));
  }

  return responderAnnotationMapContract.parse(result);
};
