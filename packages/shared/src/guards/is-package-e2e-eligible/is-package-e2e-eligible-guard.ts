/**
 * PURPOSE: Reach for this over checking a package's detected PackageType label directly —
 * detectPackageTypeLayerBroker's priority table lets an earlier rule (hono/express, MCP) return
 * before the widgets+react/ink rule is ever reached, so a package that is BOTH an http-backend
 * and a frontend would read as ineligible if eligibility were derived from the winning label
 * instead of the same underlying signals the detector itself consults.
 *
 * USAGE:
 * isPackageE2eEligibleGuard({
 *   srcDirNames: ['widgets'],
 *   packageJson: PackageJsonStub({ dependencies: { react: '18.2.0' } }),
 * });
 * // Returns true — widgets folder + react dependency, independent of any other adapter present
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';
import { hasWidgetsFolderGuard } from '../has-widgets-folder/has-widgets-folder-guard';
import { hasInkAdapterGuard } from '../has-ink-adapter/has-ink-adapter-guard';
import { reactInDepsGuard } from '../react-in-deps/react-in-deps-guard';

export const isPackageE2eEligibleGuard = ({
  adapterDirNames,
  srcDirNames,
  packageJson,
}: {
  adapterDirNames?: string[];
  srcDirNames?: string[];
  packageJson?: PackageJson;
}): boolean => {
  if (!hasWidgetsFolderGuard(srcDirNames === undefined ? {} : { srcDirNames })) {
    return false;
  }
  return (
    hasInkAdapterGuard(adapterDirNames === undefined ? {} : { adapterDirNames }) ||
    reactInDepsGuard(packageJson === undefined ? {} : { packageJson })
  );
};
