import { hasValidFileSuffixGuard } from '../has-valid-file-suffix/has-valid-file-suffix-guard';
import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';
import { pathDepthTransformer } from '../../transformers/path-depth/path-depth-transformer';

/**
 * Validates that a file passes all project folder structure requirements:
 * - Not in forbidden folder (utils, lib, helpers, etc.)
 * - In allowed folder (brokers, contracts, guards, etc.)
 * - Correct folder depth (brokers need depth 2, contracts need depth 1, etc.)
 * - Valid file suffix (-broker.ts, -contract.ts, etc.)
 *
 * Use case: Checking if file structure is valid before validating exports
 */
export const hasValidProjectFolderStructureGuard = ({
  filename,
  firstFolder,
  forbiddenFolders,
  allowedFolders,
}: {
  filename: string;
  firstFolder: string;
  forbiddenFolders: readonly string[];
  allowedFolders: readonly string[];
}): boolean => {
  // Check forbidden folder
  if (forbiddenFolders.includes(firstFolder)) {
    return false;
  }

  // Check allowed folder
  if (!allowedFolders.includes(firstFolder)) {
    return false;
  }

  // Check folder depth
  const actualDepth = pathDepthTransformer({ filePath: filename });
  const folderConfig = folderConfigStatics[firstFolder as keyof typeof folderConfigStatics];
  if (actualDepth !== folderConfig.folderDepth) {
    return false;
  }

  // Check file suffix
  if (!hasValidFileSuffixGuard({ filename, fileSuffix: folderConfig.fileSuffix })) {
    return false;
  }

  return true;
};
