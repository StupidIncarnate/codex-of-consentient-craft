/**
 * PURPOSE: Recursively walks the call graph from a source file (typically a responder), rendering
 * one `→ <exportName>` line per non-excluded import and recursing into non-terminal nodes. The
 * display token is the actual exported identifier read from the imported file's source (e.g.
 * `questLoadBroker`), prefixed with `<pkg>/<folderType>/` when the import crosses packages. Folder types in
 * `projectMapCallGraphStatics.excludedFolderTypes` (contracts, transformers, guards, assets,
 * statics, errors) are filtered out entirely. Folder types in `structuralFolderTypes` (startup,
 * flows, responders, widgets, bindings) are skipped to avoid duplicating the outer Boot-tree
 * skeleton.
 *
 * USAGE:
 * const lines = callChainLinesRenderLayerBroker({
 *   sourceFile: absoluteFilePathContract.parse('/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/orchestrator/src'),
 *   renderingFilePath: absoluteFilePathContract.parse('/repo/packages/orchestrator/src/startup/start-orchestrator.ts'),
 * });
 * // Returns ContentText[] with deep `→ <exportName>` lines, indented by depth
 *
 * WHEN-TO-USE: Boot-tree renderer producing the call-graph subtree under each non-routed responder
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import {
  folderTypeContract,
  type FolderType,
} from '../../../contracts/folder-type/folder-type-contract';
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import { projectMapCallGraphStatics } from '../../../statics/project-map-call-graph/project-map-call-graph-statics';
import { importPathToPackagePrefixTransformer } from '../../../transformers/import-path-to-package-prefix/import-path-to-package-prefix-transformer';
import { architectureExportNameResolveBroker } from '../export-name-resolve/architecture-export-name-resolve-broker';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';

const BASE_INDENT_DEFAULT: ContentText = contentTextContract.parse('      ');
const DEPTH_INDENT_UNIT = '  ';

export const callChainLinesRenderLayerBroker = ({
  sourceFile,
  packageSrcPath,
  renderingFilePath,
  depth = 0,
  visited = new Set<string>(),
  baseIndent,
}: {
  sourceFile: string;
  packageSrcPath: string;
  renderingFilePath: string;
  depth?: number;
  visited?: Set<string>;
  baseIndent?: ContentText;
}): ContentText[] => {
  const lines: ContentText[] = [];
  const effectiveBase = baseIndent ?? BASE_INDENT_DEFAULT;
  const indent = `${String(effectiveBase)}${DEPTH_INDENT_UNIT.repeat(depth)}`;

  const excluded = projectMapCallGraphStatics.excludedFolderTypes;
  const structural = projectMapCallGraphStatics.structuralFolderTypes;
  const walkedFolderTypes: FolderType[] = Object.keys(folderConfigStatics)
    .filter((t) => !excluded.some((e) => e === t) && !structural.some((s) => s === t))
    .map((t) => folderTypeContract.parse(t));

  for (const folderType of walkedFolderTypes) {
    const { entries, layers } = importsInFolderTypeFindLayerBroker({
      sourceFile,
      packageSrcPath,
      folderType,
    });

    for (const importedFile of entries) {
      if (visited.has(importedFile)) continue;
      visited.add(importedFile);

      const importedSymbol = architectureExportNameResolveBroker({ filePath: importedFile });
      let display: ContentText = importedSymbol;
      try {
        display = importPathToPackagePrefixTransformer({
          renderingFilePath,
          referencedFilePath: importedFile,
          symbolName: String(importedSymbol),
        });
      } catch {
        // Cross-package qualification unavailable — keep the bare export name.
      }

      lines.push(contentTextContract.parse(`${indent}→ ${String(display)}`));

      const recurseArgs =
        baseIndent === undefined
          ? {
              sourceFile: importedFile,
              packageSrcPath,
              renderingFilePath,
              depth: depth + 1,
              visited,
            }
          : {
              sourceFile: importedFile,
              packageSrcPath,
              renderingFilePath,
              depth: depth + 1,
              visited,
              baseIndent,
            };
      const childLines = callChainLinesRenderLayerBroker(recurseArgs);
      for (const cl of childLines) {
        lines.push(cl);
      }
    }

    for (const layerFile of layers) {
      if (visited.has(layerFile)) continue;
      visited.add(layerFile);

      const layerSymbol = architectureExportNameResolveBroker({ filePath: layerFile });
      let layerDisplay: ContentText = layerSymbol;
      try {
        layerDisplay = importPathToPackagePrefixTransformer({
          renderingFilePath,
          referencedFilePath: layerFile,
          symbolName: String(layerSymbol),
        });
      } catch {
        // Cross-package qualification unavailable — keep the bare export name.
      }

      lines.push(contentTextContract.parse(`${indent}→ ${String(layerDisplay)}`));

      const layerRecurseArgs =
        baseIndent === undefined
          ? {
              sourceFile: layerFile,
              packageSrcPath,
              renderingFilePath,
              depth: depth + 1,
              visited,
            }
          : {
              sourceFile: layerFile,
              packageSrcPath,
              renderingFilePath,
              depth: depth + 1,
              visited,
              baseIndent,
            };
      const layerChildLines = callChainLinesRenderLayerBroker(layerRecurseArgs);
      for (const cl of layerChildLines) {
        lines.push(cl);
      }
    }
  }

  return lines;
};
