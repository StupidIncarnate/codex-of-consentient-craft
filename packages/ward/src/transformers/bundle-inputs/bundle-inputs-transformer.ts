/**
 * PURPOSE: Names the globs whose contents decide whether a prebuilt bundle is still the right one.
 * Reach for this rather than `checkCommandsStatics.*.discoverPatterns`: those enumerate the files a
 * CHECKER grades, so they are extension-anchored and skip everything a bundler also reads — the CSS,
 * the SVGs, the JSON, the HTML shell.
 *
 * The split it applies is by ROLE IN THE CLOSURE, not by package name: only the package the bundle
 * is built for contributes the bundler's own inputs, and every package the `dependencies` walk
 * reached contributes sources and barrels alone.
 *
 * USAGE:
 * bundleInputsTransformer({ isBundledPackage: true });
 * // Returns the package-relative globs to hash for the package the bundle is being built FOR
 */

import {
  globPatternContract,
  type GlobPattern,
} from '../../contracts/glob-pattern/glob-pattern-contract';
import { bundleStatics } from '../../statics/bundle/bundle-statics';

export const bundleInputsTransformer = ({
  isBundledPackage,
}: {
  isBundledPackage: boolean;
}): readonly GlobPattern[] => {
  const patterns = isBundledPackage
    ? [...bundleStatics.closurePatterns, ...bundleStatics.uiPatterns]
    : bundleStatics.closurePatterns;

  return patterns.map((pattern) => globPatternContract.parse(pattern));
};
