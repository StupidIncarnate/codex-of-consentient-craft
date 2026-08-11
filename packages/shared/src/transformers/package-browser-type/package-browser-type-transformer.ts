/**
 * PURPOSE: The single place the widgets+ink / widgets+react rules are written down, so the detector's
 * priority table and every eligibility predicate answer "can a browser reach this package, and as
 * what?" from one implementation. Reach for this over `isPackageE2eEligibleGuard` when the caller
 * needs to NAME the kind — stamping it onto a quest entry, ranking it against a track's package
 * kinds — and for the guard when a bare yes/no is all the caller can act on.
 *
 * USAGE:
 * packageBrowserTypeTransformer({
 *   srcDirNames: ['widgets'],
 *   packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
 * });
 * // Returns 'frontend-react'
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';
import { packageTypeContract } from '../../contracts/package-type/package-type-contract';
import type { PackageType } from '../../contracts/package-type/package-type-contract';
import { hasInkAdapterGuard } from '../../guards/has-ink-adapter/has-ink-adapter-guard';
import { hasWidgetsFolderGuard } from '../../guards/has-widgets-folder/has-widgets-folder-guard';
import { reactInDepsGuard } from '../../guards/react-in-deps/react-in-deps-guard';

export const packageBrowserTypeTransformer = ({
  adapterDirNames,
  srcDirNames,
  packageJson,
}: {
  adapterDirNames?: string[];
  srcDirNames?: string[];
  packageJson?: PackageJson;
}): PackageType | undefined => {
  if (!hasWidgetsFolderGuard(srcDirNames === undefined ? {} : { srcDirNames })) {
    return undefined;
  }

  // Ink before react, matching the order the detection table asks these two questions in: a package
  // carrying both renders through ink, and react is then a dependency of the ink renderer rather
  // than the surface a Playwright run drives.
  if (hasInkAdapterGuard(adapterDirNames === undefined ? {} : { adapterDirNames })) {
    return packageTypeContract.parse('frontend-ink');
  }

  if (reactInDepsGuard(packageJson === undefined ? {} : { packageJson })) {
    return packageTypeContract.parse('frontend-react');
  }

  return undefined;
};
