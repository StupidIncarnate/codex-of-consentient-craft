/**
 * PURPOSE: Resolves one import specifier to the repo file it names, or null when it names none
 * (an npm package, a Node module, a `#gateway/*` path). A relative specifier resolves against its
 * importer's folder; `@scope/pkg/sub` resolves through the workspace package list, first to a
 * package-root barrel (`<dir>/sub.ts`), then to `<dir>/src/sub`. Only a file in `knownFiles`
 * counts, so a guess never invents a path.
 *
 * USAGE:
 * importTargetResolveTransformer({ fromFile, specifier: '../x/x-adapter', knownFiles, packages });
 * // Returns the CensusPath of packages/a/src/adapters/x/x-adapter.ts when it exists, else null
 */
import { censusPathNormalizeTransformer } from '../census-path-normalize/census-path-normalize-transformer';
import { censusLayoutStatics } from '../../statics/census-layout/census-layout-statics';
import type { CensusPath } from '../../contracts/census-path/census-path-contract';
import type { CensusPackage } from '../../contracts/census-package/census-package-contract';

export const importTargetResolveTransformer = ({
  fromFile,
  specifier,
  knownFiles,
  packages,
}: {
  fromFile: CensusPath;
  specifier: string;
  knownFiles: ReadonlySet<CensusPath>;
  packages: readonly CensusPackage[];
}): CensusPath | null => {
  const owner = specifier.startsWith('.')
    ? null
    : ([...packages]
        .sort((a, b) => b.name.length - a.name.length)
        .find((pkg) => specifier === pkg.name || specifier.startsWith(`${pkg.name}/`)) ?? null);

  const bases = (() => {
    if (specifier.startsWith('.')) {
      return [`${fromFile.slice(0, fromFile.lastIndexOf('/'))}/${specifier}`];
    }
    if (owner === null) {
      return [];
    }
    const rest = specifier.slice(owner.name.length + 1);
    return rest === ''
      ? [`${owner.dir}/src/index`, `${owner.dir}/index`]
      : [`${owner.dir}/${rest}`, `${owner.dir}/src/${rest}`];
  })();

  const candidates = bases.flatMap((base) => {
    const folded = censusPathNormalizeTransformer({ path: base });
    const stem = folded.replace(/\.(?:m?js|jsx)$/u, '');
    return [
      folded,
      ...censusLayoutStatics.importSuffixes.map((suffix) =>
        censusPathNormalizeTransformer({ path: `${stem}${suffix}` }),
      ),
    ];
  });

  return candidates.find((candidate) => knownFiles.has(candidate)) ?? null;
};
