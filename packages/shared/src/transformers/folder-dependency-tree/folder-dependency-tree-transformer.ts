/**
 * PURPOSE: Transforms folder configuration into 3 dependency visualization formats
 *
 * USAGE:
 * import { folderDependencyTreeTransformer } from '@dungeonmaster/shared/transformers';
 * import { folderConfigStatics } from '@dungeonmaster/shared/statics';
 * const result = folderDependencyTreeTransformer({ folderConfigs: folderConfigStatics });
 * // Returns: FolderDependencyTree with hierarchy, graph, and matrix
 *
 * WHEN-TO-USE: When visualizing folder import dependencies in different formats
 */
import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { FolderType } from '../../contracts/folder-type/folder-type-contract';
import { folderTypeContract } from '../../contracts/folder-type/folder-type-contract';
import type { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';
import type { FolderDependencyTree } from '../../contracts/folder-dependency-tree/folder-dependency-tree-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';

export const folderDependencyTreeTransformer = ({
  folderConfigs,
}: {
  folderConfigs: Record<string, (typeof folderConfigStatics)[keyof typeof folderConfigStatics]>;
}): FolderDependencyTree => {
  // Build hierarchy
  const hierarchyLines: ContentText[] = [];
  const sortedFolders = Object.keys(folderConfigs).sort((folderA, folderB) => {
    const importsA = folderConfigs[folderA]?.allowedImports.length ?? 0;
    const importsB = folderConfigs[folderB]?.allowedImports.length ?? 0;
    return importsA - importsB;
  });

  for (const folder of sortedFolders) {
    const config = folderConfigs[folder];
    if (!config) {
      continue;
    }

    const imports = config.allowedImports;
    const normalizedImports = imports.map((imp) => imp.replace(/\/$/u, ''));

    if (normalizedImports.length === 0) {
      hierarchyLines.push(
        contentTextContract.parse(`${folder}/          # Can import: nothing (leaf node)`),
      );
    } else {
      const importList = normalizedImports.join(', ');
      hierarchyLines.push(
        contentTextContract.parse(`${folder}/          # Can import: ${importList}`),
      );
    }
  }

  const hierarchy = contentTextContract.parse(hierarchyLines.map((line) => line).join('\n'));

  // Build graph
  const graph: Record<FolderType, readonly ImportPath[]> = {} as Record<
    FolderType,
    readonly ImportPath[]
  >;
  for (const folder of Object.keys(folderConfigs)) {
    const config = folderConfigs[folder];
    if (!config) {
      continue;
    }

    const normalizedImports: readonly ImportPath[] = config.allowedImports.map(
      (imp) => imp.replace(/\/$/u, '') as ImportPath,
    );

    const folderType = folderTypeContract.parse(folder);
    graph[folderType] = normalizedImports;
  }

  // Build matrix
  const matrixLines: ContentText[] = [];
  const folders = Object.keys(folderConfigs).sort();
  const columnWidth = 12;

  const headerCells = ['FROM \\ TO', ...folders];
  const header = headerCells.map((cell) => cell.padEnd(columnWidth)).join(' | ');
  matrixLines.push(contentTextContract.parse(header));

  const separator = headerCells.map(() => '-'.repeat(columnWidth)).join('-+-');
  matrixLines.push(contentTextContract.parse(separator));

  for (const fromFolder of folders) {
    const cells = [fromFolder.padEnd(columnWidth)];

    for (const toFolder of folders) {
      const fromFolderType = folderTypeContract.parse(fromFolder);
      const canImport = graph[fromFolderType]?.some((imp) => imp === toFolder) ?? false;
      const mark = canImport ? '✓' : '';
      cells.push(mark.padEnd(columnWidth));
    }

    matrixLines.push(contentTextContract.parse(cells.join(' | ')));
  }

  const matrix = contentTextContract.parse(matrixLines.map((line) => line).join('\n'));

  return {
    hierarchy,
    graph,
    matrix,
  };
};
