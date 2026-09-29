/**
 * PURPOSE: Resolves an import specifier to a file the scan already read, without touching the disk:
 * relative specifiers by path, workspace package specifiers through the package's directory. Reach
 * for this over TypeScript's own resolver when every candidate file is already in memory, so the
 * scan makes no `existsSync` call per candidate.
 *
 * USAGE:
 * moduleSpecifierResolveLayerTransformer({ specifier, fromFile, knownFiles, packages });
 * // Returns the AbsoluteFilePath of the file the specifier names, or undefined
 */
import { dirname, resolve } from '#gateway/node/path';

import { absoluteFilePathContract } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';
import type { ContractIndexPackage } from '../../contracts/contract-index-package/contract-index-package-contract';
import { contractIndexStatics } from '../../statics/contract-index/contract-index-statics';

const JS_EXTENSION_PATTERN = /\.jsx?$/u;

export const moduleSpecifierResolveLayerTransformer = ({
  specifier,
  fromFile,
  knownFiles,
  packages,
}: {
  specifier: ImportPath;
  fromFile: AbsoluteFilePath;
  knownFiles: ReadonlySet<AbsoluteFilePath>;
  packages: ContractIndexPackage[];
}): AbsoluteFilePath | undefined => {
  const bases: AbsoluteFilePath[] = [];

  if (specifier.startsWith('.')) {
    bases.push(
      absoluteFilePathContract.parse(
        resolve(dirname(fromFile), specifier.replace(JS_EXTENSION_PATTERN, '')),
      ),
    );
  } else {
    const [owner] = packages
      .filter(
        (candidate) =>
          String(specifier) === String(candidate.name) ||
          specifier.startsWith(`${candidate.name}/`),
      )
      .sort((left, right) => right.name.length - left.name.length);

    if (owner === undefined) {
      return undefined;
    }

    const subpath = specifier.slice(owner.name.length + 1);
    const lastSegment = subpath.split('/').at(-1) ?? '';
    bases.push(
      ...(subpath === ''
        ? [`${owner.dir}/src/index`, `${owner.dir}/index`]
        : [
            `${owner.dir}/${subpath}`,
            `${owner.dir}/src/${subpath}`,
            `${owner.dir}/src/${subpath}/${lastSegment}`,
          ]
      ).map((base) => absoluteFilePathContract.parse(base)),
    );
  }

  const found = bases
    .flatMap((base) =>
      contractIndexStatics.resolve.fileSuffixes.map((suffix) => `${base}${suffix}`),
    )
    .find((candidate) => knownFiles.has(absoluteFilePathContract.parse(candidate)));

  return found === undefined ? undefined : absoluteFilePathContract.parse(found);
};
