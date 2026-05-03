/**
 * PURPOSE: Recursively walks the call graph from a source file (typically a responder), rendering
 * one `→ <slash-path>` line per non-excluded import and recursing into non-terminal nodes. Adapters
 * are package exits — rendered as leaves and never followed. Folder types in
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
 * // Returns ContentText[] with deep `→ brokers/.../...` and `→ adapters/...` lines, indented by depth
 *
 * WHEN-TO-USE: Boot-tree renderer producing the call-graph subtree under each non-routed responder
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
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
import { adapterFilePathToDisplayTransformer } from '../../../transformers/adapter-file-path-to-display/adapter-file-path-to-display-transformer';
import { filePathToDisplayNameTransformer } from '../../../transformers/file-path-to-display-name/file-path-to-display-name-transformer';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';

const BASE_INDENT = '      ';
const DEPTH_INDENT_UNIT = '  ';
const TERMINAL_FOLDER_TYPE: FolderType = folderTypeContract.parse('adapters');

export const callChainLinesRenderLayerBroker = ({
  sourceFile,
  packageSrcPath,
  renderingFilePath,
  depth = 0,
  visited = new Set<AbsoluteFilePath>(),
}: {
  sourceFile: AbsoluteFilePath;
  packageSrcPath: AbsoluteFilePath;
  renderingFilePath: AbsoluteFilePath;
  depth?: number;
  visited?: Set<AbsoluteFilePath>;
}): ContentText[] => {
  const lines: ContentText[] = [];
  const indent = `${BASE_INDENT}${DEPTH_INDENT_UNIT.repeat(depth)}`;

  const excluded = projectMapCallGraphStatics.excludedFolderTypes;
  const structural = projectMapCallGraphStatics.structuralFolderTypes;
  const walkedFolderTypes: FolderType[] = Object.keys(folderConfigStatics)
    .filter((t) => !excluded.some((e) => e === t) && !structural.some((s) => s === t))
    .map((t) => folderTypeContract.parse(t));

  for (const folderType of walkedFolderTypes) {
    const imports = importsInFolderTypeFindLayerBroker({
      sourceFile,
      packageSrcPath,
      folderType: String(folderType),
    });

    for (const importedFile of imports) {
      if (visited.has(importedFile)) continue;
      visited.add(importedFile);

      let display: ContentText = filePathToDisplayNameTransformer({
        filePath: importedFile,
        packageSrcPath,
      });
      try {
        display = adapterFilePathToDisplayTransformer({
          filePath: importedFile,
          renderingFilePath,
        });
      } catch {
        // Cross-package display unavailable — keep the within-package display already assigned.
      }

      lines.push(contentTextContract.parse(`${indent}→ ${String(display)}`));

      if (folderType === TERMINAL_FOLDER_TYPE) continue;

      const childLines = callChainLinesRenderLayerBroker({
        sourceFile: importedFile,
        packageSrcPath,
        renderingFilePath,
        depth: depth + 1,
        visited,
      });
      for (const cl of childLines) {
        lines.push(cl);
      }
    }
  }

  return lines;
};
