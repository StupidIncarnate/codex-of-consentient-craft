/**
 * PURPOSE: Confirms one workspace package's manifest points at real files. Reads its
 * package.json, pulls every field that names compiled output
 * (`packageJsonDeclaredEntriesTransformer`), and stats each declared path relative to the package
 * directory. Reach for this over trusting `tsc`/`eslint`'s own resolution: every ward check sets
 * `--conditions=source` (`sourceConditionSupportedBroker`), which resolves straight past a stale
 * main/exports/types/bin entry to the TypeScript source named under `"source"` — so a build-time-
 * only mismatch passes every check here and only breaks a real consumer's `require`/`import`,
 * which sets no such condition.
 *
 * USAGE:
 * const missing = await workspaceManifestEntriesVerifyBroker({
 *   packagePath: AbsoluteFilePathStub({ value: '/repo/packages/cli' }),
 * });
 * // Returns ManifestEntryDeclaration[] — the declared fields whose path does not exist on disk
 */

import { readFile, statIfExists } from '#gateway/node/fs__promises';

import { packageJsonRawContract } from '@dungeonmaster/shared/contracts';
import type { ManifestEntryDeclaration } from '../../../contracts/manifest-entry-declaration/manifest-entry-declaration-contract';
import { packageJsonDeclaredEntriesTransformer } from '../../../transformers/package-json-declared-entries/package-json-declared-entries-transformer';

export const workspaceManifestEntriesVerifyBroker = async ({
  packagePath,
}: {
  packagePath: string;
}): Promise<ManifestEntryDeclaration[]> => {
  const manifestPath = `${packagePath}/package.json`;
  const raw = await readFile(manifestPath);
  const manifest = packageJsonRawContract.parse(JSON.parse(raw));

  const declarations = packageJsonDeclaredEntriesTransformer({ manifest });

  const verified = await Promise.all(
    declarations.map(async (declaration) => {
      const absolutePath = `${packagePath}/${declaration.declaredPath}`;
      const stats = await statIfExists(absolutePath);
      return stats === null ? declaration : null;
    }),
  );

  return verified.filter((entry) => entry !== null);
};
