/**
 * PURPOSE: Finds the workspace package that owns a file: the one whose folder is the longest
 * prefix of the file's path. Longest wins so a gateway package under `packages/@gateway/` is
 * never mistaken for anything above it.
 *
 * USAGE:
 * censusPackageOfFileTransformer({ file, packages });
 * // Returns the CensusPackage for packages/siegelense/... or null when no package owns the file
 */
import type { CensusPackage } from '../../contracts/census-package/census-package-contract';

export const censusPackageOfFileTransformer = ({
  file,
  packages,
}: {
  file: string;
  packages: readonly CensusPackage[];
}): CensusPackage | null =>
  [...packages]
    .filter((pkg) => file.startsWith(`${pkg.dir}/`))
    .sort((a, b) => b.dir.length - a.dir.length)[0] ?? null;
