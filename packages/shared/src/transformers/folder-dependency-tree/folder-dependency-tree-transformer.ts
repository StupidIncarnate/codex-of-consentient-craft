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
import type { FolderType } from '../../contracts/folder-type/folder-type-contract';
import { folderTypeContract } from '../../contracts/folder-type/folder-type-contract';
import type { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';
import {
  folderDependencyTreeContract,
  type FolderDependencyTree,
} from '../../contracts/folder-dependency-tree/folder-dependency-tree-contract';

export const folderDependencyTreeTransformer = ({
  folderConfigs,
}: {
  folderConfigs: Record<string, (typeof folderConfigStatics)[keyof typeof folderConfigStatics]>;
}): FolderDependencyTree => {
  // Build hierarchy
  const hierarchyLines: string[] = [];
  const sortedFolders = Object.keys(folderConfigs).sort((folderA, folderB) => {
    const importsA = folderConfigs[folderA]?.allowedImports.length ?? 0;
    const importsB = folderConfigs[folderB]?.allowedImports.length ?? 0;
    return importsA - importsB;
  });

  // Padded off the widest label so every `# Can import:` starts in the same column — a fixed gutter
  // puts a 6-character folder and a 12-character one at different offsets and the list stops scanning.
  const LABEL_GUTTER = 2;
  const labelWidth =
    sortedFolders.reduce((widest, folder) => Math.max(widest, `${folder}/`.length), 0) +
    LABEL_GUTTER;

  for (const folder of sortedFolders) {
    const config = folderConfigs[folder];
    if (!config) {
      continue;
    }

    const label = `${folder}/`.padEnd(labelWidth);
    const normalizedImports = config.allowedImports.map((imp) => imp.replace(/\/$/u, ''));

    if (normalizedImports.length === 0) {
      hierarchyLines.push(`${label}# Can import: nothing (leaf node)`);
    } else {
      hierarchyLines.push(
        `${label}# Can import: ${normalizedImports.join(', ')}`,
      );
    }
  }

  const hierarchy = hierarchyLines.map((line) => line).join('\n');

  // Build graph
  const graph: Record<FolderType, readonly string[]> = {} as Record<
    FolderType,
    readonly string[]
  >;
  for (const folder of Object.keys(folderConfigs)) {
    const config = folderConfigs[folder];
    if (!config) {
      continue;
    }

    const normalizedImports: readonly string[] = config.allowedImports.map(
      (imp) => imp.replace(/\/$/u, '') as string,
    );

    const folderType = folderTypeContract.parse(folder);
    graph[folderType] = normalizedImports;
  }

  // Build matrix
  const matrixLines: string[] = [];
  const folders = Object.keys(folderConfigs).sort();
  const columnWidth = 12;

  const headerCells = ['FROM \\ TO', ...folders];
  const header = headerCells.map((cell) => cell.padEnd(columnWidth)).join(' | ');
  matrixLines.push(header);

  const separator = headerCells.map(() => '-'.repeat(columnWidth)).join('-+-');
  matrixLines.push(separator);

  for (const fromFolder of folders) {
    const cells = [fromFolder.padEnd(columnWidth)];

    for (const toFolder of folders) {
      const fromFolderType = folderTypeContract.parse(fromFolder);
      const canImport = graph[fromFolderType]?.some((imp) => imp === toFolder) ?? false;
      const mark = canImport ? '✓' : '';
      cells.push(mark.padEnd(columnWidth));
    }

    matrixLines.push(cells.join(' | '));
  }

  const matrix = matrixLines.map((line) => line).join('\n');

  return folderDependencyTreeContract.parse({
    hierarchy,
    graph,
    matrix,
  });
};
