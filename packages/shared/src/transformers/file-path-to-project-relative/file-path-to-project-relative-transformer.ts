/**
 * PURPOSE: Converts an absolute file path to a project-relative display token of the form
 * `<packageName>/<folder-path-without-src>` with the .ts extension stripped.
 * Given `/repo/packages/orchestrator/src/state/events-state.ts` and projectRoot `/repo`,
 * returns `orchestrator/state/events-state`.
 *
 * USAGE:
 * filePathToProjectRelativeTransformer({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/orchestrator/src/state/events-state.ts'),
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns ContentText 'orchestrator/state/events-state'
 *
 * WHEN-TO-USE: Side-channel and edge renderers converting absolute paths to human-readable
 * cross-package display tokens in the project-map output
 */

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const PACKAGES_SEGMENT = '/packages/';
const SRC_PREFIX = 'src/';
const TS_EXT = '.ts';

export const filePathToProjectRelativeTransformer = ({
  filePath,
  projectRoot,
}: {
  filePath: AbsoluteFilePath;
  projectRoot: AbsoluteFilePath;
}): ContentText => {
  const raw = String(filePath);
  const packagesPrefix = `${String(projectRoot)}${PACKAGES_SEGMENT}`;

  if (!raw.startsWith(packagesPrefix)) {
    return contentTextContract.parse(raw);
  }

  const withoutPackages = raw.slice(packagesPrefix.length);
  const slashIdx = withoutPackages.indexOf('/');
  if (slashIdx === -1) {
    return contentTextContract.parse(withoutPackages);
  }

  const pkgName = withoutPackages.slice(0, slashIdx);
  const rest = withoutPackages.slice(slashIdx + 1);
  const restNormalized = rest.startsWith(SRC_PREFIX) ? rest.slice(SRC_PREFIX.length) : rest;
  const withoutExt = restNormalized.endsWith(TS_EXT)
    ? restNormalized.slice(0, restNormalized.length - TS_EXT.length)
    : restNormalized;

  return contentTextContract.parse(`${pkgName}/${withoutExt}`);
};
