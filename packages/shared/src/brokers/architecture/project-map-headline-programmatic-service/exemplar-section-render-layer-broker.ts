/**
 * PURPOSE: Renders the Detailed exemplar section for one API method, tracing from the namespace
 * object entry point inward through the startup file's imports to find flows and responders.
 * Produces a BOUNDARY box for cross-package adapter calls when present.
 *
 * USAGE:
 * const section = exemplarSectionRenderLayerBroker({
 *   methodName: contentTextContract.parse('startQuest'),
 *   startupFilePath: absoluteFilePathContract.parse('/repo/packages/orchestrator/src/startup/start-orchestrator.ts'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // Returns ContentText with ## Detailed exemplar header and call trace code block
 *
 * WHEN-TO-USE: project-map-headline-programmatic-service-broker building the Detailed exemplar section
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineProgrammaticServiceStatics } from '../../../statics/project-map-headline-programmatic-service/project-map-headline-programmatic-service-statics';
import { namespaceCallFirstExtractTransformer } from '../../../transformers/namespace-call-first-extract/namespace-call-first-extract-transformer';
import { namespaceNameExtractTransformer } from '../../../transformers/namespace-name-extract/namespace-name-extract-transformer';
import { adapterFolderFromImportPathTransformer } from '../../../transformers/adapter-folder-from-import-path/adapter-folder-from-import-path-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { readSourceLayerBroker } from './read-source-layer-broker';

export const exemplarSectionRenderLayerBroker = ({
  methodName,
  startupFilePath,
  packageRoot: _packageRoot,
}: {
  methodName: ContentText;
  startupFilePath: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const statics = projectMapHeadlineProgrammaticServiceStatics;
  const methodStr = String(methodName);

  const titleLine = `${statics.exemplarSectionPrefix}${methodStr}${statics.exemplarSectionSuffix}`;

  const parts: ContentText[] = [
    contentTextContract.parse(titleLine),
    contentTextContract.parse(''),
    contentTextContract.parse(statics.exemplarDescription),
    contentTextContract.parse(''),
    contentTextContract.parse(statics.exemplarRequestChainHeader),
    contentTextContract.parse(''),
    contentTextContract.parse('```'),
  ];

  const startupSource = readSourceLayerBroker({ filePath: startupFilePath });

  if (startupSource === undefined) {
    parts.push(contentTextContract.parse(`${methodStr}(...)   (startup source not readable)`));
    parts.push(contentTextContract.parse(''));
    parts.push(contentTextContract.parse('```'));
    return contentTextContract.parse(parts.map(String).join('\n'));
  }

  // Entry: method call shape
  parts.push(contentTextContract.parse(`${methodStr}(...)`));

  // Find the first namespace-qualified call in the startup source to show the flow delegation
  const firstCall = namespaceCallFirstExtractTransformer({ source: startupSource });
  if (firstCall !== null) {
    parts.push(contentTextContract.parse(`  → ${String(firstCall)}`));
  }

  // Trace into adapter imports from the startup file to find cross-package BOUNDARY calls
  const allImports = importStatementsExtractTransformer({ source: startupSource });
  const adapterImports = allImports.filter((p) => String(p).includes('adapters/'));

  if (adapterImports.length > 0) {
    const [adp] = adapterImports;
    if (adp !== undefined) {
      const adpAbsPath = relativeImportResolveTransformer({
        sourceFile: startupFilePath,
        importPath: adp,
      });

      if (adpAbsPath !== null) {
        const adpSource = readSourceLayerBroker({ filePath: adpAbsPath });
        if (adpSource !== undefined) {
          const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
          if (String(adpFolder) !== '') {
            parts.push(contentTextContract.parse(`      → ${String(adpFolder)}`));
          }

          const adpCall = namespaceCallFirstExtractTransformer({ source: adpSource });
          if (adpCall !== null) {
            parts.push(contentTextContract.parse(`            → ${String(adpCall)}`));
          }

          const namespaceName = namespaceNameExtractTransformer({ source: adpSource });
          if (namespaceName !== null) {
            parts.push(contentTextContract.parse(''));
            const indent = statics.genericBoundaryBoxIndent;
            const label = `${statics.genericBoundaryBoxLabel} ${String(namespaceName)}`;
            const note = statics.genericBoundaryBoxNote;
            const fill = statics.genericBoundaryBoxFill;
            const side = statics.genericBoundaryBoxSide;
            const tl = statics.genericBoundaryBoxCornerTL;
            const tr = statics.genericBoundaryBoxCornerTR;
            const bl = statics.genericBoundaryBoxCornerBL;
            const br = statics.genericBoundaryBoxCornerBR;
            const pad = statics.boundaryBoxPad;
            const innerWidth = Math.max(
              label.length + pad,
              note.length + pad,
              statics.boundaryBoxInnerWidth,
            );
            parts.push(
              contentTextContract.parse(`${indent}${tl}${fill.repeat(innerWidth + pad)}${tr}`),
            );
            parts.push(
              contentTextContract.parse(`${indent}${side} ${label.padEnd(innerWidth)} ${side}`),
            );
            parts.push(
              contentTextContract.parse(`${indent}${side} ${''.padEnd(innerWidth)} ${side}`),
            );
            parts.push(
              contentTextContract.parse(`${indent}${side} ${note.padEnd(innerWidth)} ${side}`),
            );
            parts.push(
              contentTextContract.parse(`${indent}${bl}${fill.repeat(innerWidth + pad)}${br}`),
            );
          }
        }
      }
    }
  }

  parts.push(contentTextContract.parse(''));
  parts.push(contentTextContract.parse('```'));

  return contentTextContract.parse(parts.map(String).join('\n'));
};
