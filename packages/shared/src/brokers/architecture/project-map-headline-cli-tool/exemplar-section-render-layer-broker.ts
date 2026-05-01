/**
 * PURPOSE: Renders the Detailed exemplar section for one CLI subcommand, tracing from
 * process.argv parse → startup → flow → responder → downstream effects (adapter calls,
 * cross-package BOUNDARY boxes when present).
 *
 * USAGE:
 * const section = exemplarSectionRenderLayerBroker({
 *   subcommand: contentTextContract.parse('run'),
 *   startupSource: contentTextContract.parse('...'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/ward'),
 * });
 * // Returns ContentText with ## Detailed exemplar header and call trace code block
 *
 * WHEN-TO-USE: project-map-headline-cli-tool-broker building the Detailed exemplar section
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineCliToolStatics } from '../../../statics/project-map-headline-cli-tool/project-map-headline-cli-tool-statics';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { adapterFolderFromImportPathTransformer } from '../../../transformers/adapter-folder-from-import-path/adapter-folder-from-import-path-transformer';
import { namespaceCallFirstExtractTransformer } from '../../../transformers/namespace-call-first-extract/namespace-call-first-extract-transformer';
import { namespaceNameExtractTransformer } from '../../../transformers/namespace-name-extract/namespace-name-extract-transformer';
import { readSourceLayerBroker } from './read-source-layer-broker';
import { exemplarBoundaryBoxRenderLayerBroker } from './exemplar-boundary-box-render-layer-broker';

export const exemplarSectionRenderLayerBroker = ({
  subcommand,
  startupSource,
  packageRoot,
}: {
  subcommand: ContentText;
  startupSource: ContentText;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const statics = projectMapHeadlineCliToolStatics;
  const cmdStr = String(subcommand);

  const titleLine = `${statics.exemplarSectionPrefix}${cmdStr}${statics.exemplarSectionSuffix}`;

  const parts: ContentText[] = [
    contentTextContract.parse(titleLine),
    contentTextContract.parse(''),
    contentTextContract.parse(statics.exemplarDescription),
    contentTextContract.parse(''),
    contentTextContract.parse(statics.exemplarRequestChainHeader),
    contentTextContract.parse(''),
    contentTextContract.parse('```'),
  ];

  parts.push(contentTextContract.parse(`process.argv[2] === '${cmdStr}'`));

  // Find the startup file path to resolve relative imports from
  const startupDir = absoluteFilePathContract.parse(`${String(packageRoot)}/src/startup`);

  // Scan startup source for responder imports
  const allImports = importStatementsExtractTransformer({ source: startupSource });
  const flowImports = allImports.filter(
    (p) => String(p).includes('flows/') || String(p).includes('responders/'),
  );

  const [firstFlowImport] = flowImports;
  if (firstFlowImport !== undefined) {
    const stubStartupFile = absoluteFilePathContract.parse(`${String(startupDir)}/start-stub.ts`);
    const flowAbsPath = relativeImportResolveTransformer({
      sourceFile: stubStartupFile,
      importPath: firstFlowImport,
    });

    if (flowAbsPath !== null) {
      const importName = String(firstFlowImport).split('/').at(-1) ?? '';
      parts.push(contentTextContract.parse(`  → ${importName}`));

      const flowSource = readSourceLayerBroker({ filePath: flowAbsPath });

      if (flowSource !== undefined) {
        const flowImportsInner = importStatementsExtractTransformer({ source: flowSource });
        const adapterImports = flowImportsInner.filter((p) => String(p).includes('adapters/'));

        if (adapterImports.length === 1) {
          const [adp] = adapterImports;
          if (adp !== undefined) {
            const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
            if (String(adpFolder) !== '') {
              parts.push(contentTextContract.parse(`      → ${String(adpFolder)}`));
            }

            const adpAbsPath = relativeImportResolveTransformer({
              sourceFile: flowAbsPath,
              importPath: adp,
            });
            if (adpAbsPath !== null) {
              const adpSource = readSourceLayerBroker({ filePath: adpAbsPath });
              if (adpSource !== undefined) {
                const call = namespaceCallFirstExtractTransformer({ source: adpSource });
                if (call !== null) {
                  parts.push(contentTextContract.parse(`            → ${String(call)}`));
                }
                const namespaceName = namespaceNameExtractTransformer({ source: adpSource });
                if (namespaceName !== null) {
                  parts.push(contentTextContract.parse(''));
                  const boxLines = exemplarBoundaryBoxRenderLayerBroker({
                    crossPackageName: namespaceName,
                  });
                  for (const boxLine of boxLines) {
                    parts.push(boxLine);
                  }
                }
              }
            }
          }
        } else if (adapterImports.length > 1) {
          for (let i = 0; i < adapterImports.length; i++) {
            const adp = adapterImports[i];
            if (adp === undefined) continue;
            const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
            const isLast = i === adapterImports.length - 1;
            const prefix = isLast ? '      └─→' : '      ├─→';
            if (String(adpFolder) !== '') {
              parts.push(contentTextContract.parse(`${prefix} ${String(adpFolder)}`));
            }
          }
        }
      }
    }
  }

  parts.push(contentTextContract.parse(''));
  parts.push(contentTextContract.parse('```'));

  return contentTextContract.parse(parts.map(String).join('\n'));
};
