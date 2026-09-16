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

import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { packageJsonRawContract } from '../../../contracts/package-json-raw/package-json-raw-contract';
import type { ManifestEntryDeclaration } from '../../../contracts/manifest-entry-declaration/manifest-entry-declaration-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { packageJsonDeclaredEntriesTransformer } from '../../../transformers/package-json-declared-entries/package-json-declared-entries-transformer';

export const workspaceManifestEntriesVerifyBroker = async ({
  packagePath,
}: {
  packagePath: AbsoluteFilePath;
}): Promise<ManifestEntryDeclaration[]> => {
  const manifestPath = filePathContract.parse(`${packagePath}/package.json`);
  const raw = await fsReadFileAdapter({ filePath: manifestPath });
  const manifest = packageJsonRawContract.parse(JSON.parse(raw));

  const declarations = packageJsonDeclaredEntriesTransformer({ manifest });

  const verified = await Promise.all(
    declarations.map(async (declaration) => {
      const absolutePath = filePathContract.parse(`${packagePath}/${declaration.declaredPath}`);
      const stats = await fsStatAdapter({ filePath: absolutePath });
      return stats === null ? declaration : null;
    }),
  );

  return verified.filter((entry): entry is ManifestEntryDeclaration => entry !== null);
};
