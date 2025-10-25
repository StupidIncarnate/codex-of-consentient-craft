import type { Identifier } from '@questmaestro/shared/contracts';
import { identifierContract } from '@questmaestro/shared/contracts';

/**
 * Extracts the project folder type (brokers, contracts, guards, etc.) from a file path.
 * Example: '/project/src/brokers/user/fetch.ts' -> 'brokers'
 * Returns null if file is not in /src/ or has no subfolders.
 *
 * Use case: Determining which folder-specific rules to apply (broker rules, contract rules, etc.)
 */
export const projectFolderTypeFromFilePathTransformer = ({
  filename,
}: {
  filename: string;
}): Identifier | null => {
  const [, pathAfterSrc] = filename.split('/src/');

  if (pathAfterSrc === undefined || pathAfterSrc === '' || !pathAfterSrc.includes('/')) {
    return null;
  }

  const [firstFolder] = pathAfterSrc.split('/');

  if (firstFolder === undefined || firstFolder === '') {
    return null;
  }

  return identifierContract.parse(firstFolder);
};
