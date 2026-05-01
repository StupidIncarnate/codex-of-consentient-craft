/**
 * PURPOSE: Renders the Detailed exemplar section for one hook bin entry, tracing from
 * stdin JSON event → startup → flow → responder → adapter calls → exit code.
 *
 * USAGE:
 * const section = exemplarSectionRenderLayerBroker({
 *   binName: contentTextContract.parse('dungeonmaster-pre-edit-lint'),
 *   startupSource: contentTextContract.parse('...'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/hooks'),
 * });
 * // Returns ContentText with ## Detailed exemplar header and call trace code block
 *
 * WHEN-TO-USE: project-map-headline-hook-handlers-broker building the Detailed exemplar section
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineHookHandlersStatics } from '../../../statics/project-map-headline-hook-handlers/project-map-headline-hook-handlers-statics';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { adapterFolderFromImportPathTransformer } from '../../../transformers/adapter-folder-from-import-path/adapter-folder-from-import-path-transformer';
import { hookFlowImportExtractTransformer } from '../../../transformers/hook-flow-import-extract/hook-flow-import-extract-transformer';
import { readSourceLayerBroker } from './read-source-layer-broker';

export const exemplarSectionRenderLayerBroker = ({
  binName,
  startupSource,
  packageRoot,
}: {
  binName: ContentText;
  startupSource: ContentText;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const statics = projectMapHeadlineHookHandlersStatics;
  const binStr = String(binName);

  const titleLine = `${statics.exemplarSectionPrefix}${binStr}${statics.exemplarSectionSuffix}`;

  const parts: ContentText[] = [
    contentTextContract.parse(titleLine),
    contentTextContract.parse(''),
    contentTextContract.parse(statics.exemplarDescription),
    contentTextContract.parse(''),
    contentTextContract.parse(statics.exemplarRequestChainHeader),
    contentTextContract.parse(''),
    contentTextContract.parse('```'),
  ];

  parts.push(contentTextContract.parse(`stdin JSON event → ${binStr}`));

  const startupDir = absoluteFilePathContract.parse(`${String(packageRoot)}/src/startup`);

  // Find the flow/responder import from startup
  const flowImport = hookFlowImportExtractTransformer({ source: startupSource });

  if (flowImport !== undefined) {
    const segments = String(flowImport).split('/');
    const flowName = segments.at(-1) ?? String(flowImport);
    parts.push(contentTextContract.parse(`  → ${flowName}`));

    const stubStartupFile = absoluteFilePathContract.parse(`${String(startupDir)}/start-stub.ts`);
    const flowAbsPath = relativeImportResolveTransformer({
      sourceFile: stubStartupFile,
      importPath: flowImport,
    });

    if (flowAbsPath !== null) {
      const flowSource = readSourceLayerBroker({ filePath: flowAbsPath });

      if (flowSource !== undefined) {
        // Look for responder or inner flow imports
        const flowImports = importStatementsExtractTransformer({ source: flowSource });
        const responderImports = flowImports.filter(
          (p) => String(p).includes('responders/') || String(p).includes('flows/'),
        );
        const [firstResponder] = responderImports;
        if (firstResponder !== undefined) {
          const respSegments = String(firstResponder).split('/');
          const respName = respSegments.at(-1) ?? String(firstResponder);
          parts.push(contentTextContract.parse(`      → ${respName}`));
        }

        // Detect adapter calls in the flow
        const adapterImports = flowImports.filter((p) => String(p).includes('adapters/'));
        if (adapterImports.length === 1) {
          const [adp] = adapterImports;
          if (adp !== undefined) {
            const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
            if (String(adpFolder) !== '') {
              parts.push(contentTextContract.parse(`            → ${String(adpFolder)}`));
            }
          }
        } else if (adapterImports.length > 1) {
          for (let i = 0; i < adapterImports.length; i++) {
            const adp = adapterImports[i];
            if (adp === undefined) continue;
            const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
            const isLast = i === adapterImports.length - 1;
            const prefix = isLast ? '            └─→' : '            ├─→';
            if (String(adpFolder) !== '') {
              parts.push(contentTextContract.parse(`${prefix} ${String(adpFolder)}`));
            }
          }
        }
      }
    }
  }

  parts.push(contentTextContract.parse('  → exit 0 (success) | exit 2 (block)'));
  parts.push(contentTextContract.parse(''));
  parts.push(contentTextContract.parse('```'));

  return contentTextContract.parse(parts.map(String).join('\n'));
};
