/**
 * PURPOSE: Diffs a barrel's own named re-exports against what its sibling wrapper folders (one
 * level under the subpath directory) actually export, both directions. A wrapper's `const`,
 * `function` or `class` export — including a sibling `.error.ts`'s one class — with no matching
 * barrel re-export is `barrelMissingReexport`; a barrel re-export whose relative target file is
 * missing, or exists but no longer carries that name (value OR type), is `barrelStaleReexport`. A
 * type-only wrapper file (`fs-error.ts`, `path-matcher.ts`) contributes no VALUE name, so it is never
 * a completeness requirement — a barrel is free to re-export its type anyway, which is why the stale
 * check accepts a match in either valueNames or typeNames. A `.proxy`/`.stub`-sourced re-export is
 * barrel-no-test-support-reexport's own complaint, not this one's, so it is skipped here entirely. A
 * re-export that already climbed outside its own subpath (source starts with `../`) is
 * barrel-single-home's complaint; resolving it against THIS subpath's directory would be checking
 * the wrong folder, so it is skipped here too.
 *
 * USAGE:
 * const complete = barrelCompletenessLayerBroker({
 *   node: barrelProgramNode,
 *   context,
 *   fileName: 'fs.ts',
 *   subpathDirectory: filePathContract.parse('/repo/packages/@gateway/node/src/fs/'),
 *   reexports: [{ name: 'readFileSync', source: './read-file-sync/read-file-sync' }],
 * });
 * // Reports 'barrelMissingReexport' for every wrapper export the list above leaves out, and
 * // 'barrelStaleReexport' for every listed entry whose target file no longer carries that name
 */
import type { FilePath, Identifier, ImportPath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { existsSync, readFileSync, readdirEntriesSync } from '#gateway/node/fs';
import { isGatewayWrapperImplementationFileGuard } from '../../../guards/is-gateway-wrapper-implementation-file/is-gateway-wrapper-implementation-file-guard';
import { gatewayWrapperExportedNamesTransformer } from '../../../transformers/gateway-wrapper-exported-names/gateway-wrapper-exported-names-transformer';

export const barrelCompletenessLayerBroker = ({
  node,
  context,
  fileName,
  subpathDirectory,
  reexports,
}: {
  node: Tsestree;
  context: EslintContext;
  fileName: string;
  subpathDirectory: FilePath;
  reexports: { name: Identifier; source: ImportPath }[];
}): boolean => {
  let complete = true;
  const reexportedNames = new Set(reexports.map((reexport) => reexport.name));

  const wrapperFolders = readdirEntriesSync(subpathDirectory).filter(
    (entry) => entry.kind === 'directory',
  );

  for (const wrapperFolder of wrapperFolders) {
    const wrapperDirectory = filePathContract.parse(`${subpathDirectory}${wrapperFolder.name}/`);
    const wrapperFiles = readdirEntriesSync(wrapperDirectory).filter(
      (entry) =>
        entry.kind !== 'directory' &&
        isGatewayWrapperImplementationFileGuard({ fileName: entry.name }),
    );

    for (const wrapperFile of wrapperFiles) {
      const wrapperFilePath = filePathContract.parse(`${wrapperDirectory}${wrapperFile.name}`);
      const { valueNames } = gatewayWrapperExportedNamesTransformer({
        sourceText: readFileSync(wrapperFilePath),
      });

      for (const valueName of valueNames) {
        if (reexportedNames.has(valueName)) {
          continue;
        }

        complete = false;
        context.report({
          node,
          messageId: 'barrelMissingReexport',
          data: { fileName, name: valueName, wrapperFile: wrapperFile.name },
        });
      }
    }
  }

  for (const reexport of reexports) {
    if (!reexport.source.startsWith('./')) {
      continue;
    }
    if (reexport.source.endsWith('.proxy') || reexport.source.endsWith('.stub')) {
      continue;
    }

    const relativePath = reexport.source.slice('./'.length);
    const targetFilePath = filePathContract.parse(`${subpathDirectory}${relativePath}.ts`);

    if (!existsSync(targetFilePath)) {
      complete = false;
      context.report({
        node,
        messageId: 'barrelStaleReexport',
        data: { fileName, name: reexport.name, source: reexport.source },
      });
      continue;
    }

    const { valueNames, typeNames } = gatewayWrapperExportedNamesTransformer({
      sourceText: readFileSync(targetFilePath),
    });

    if (!valueNames.includes(reexport.name) && !typeNames.includes(reexport.name)) {
      complete = false;
      context.report({
        node,
        messageId: 'barrelStaleReexport',
        data: { fileName, name: reexport.name, source: reexport.source },
      });
    }
  }

  return complete;
};
