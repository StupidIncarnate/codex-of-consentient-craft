/**
 * PURPOSE: Reads package.json from a package directory and extracts the description field
 *
 * USAGE:
 * const desc = readPackageDescriptionLayerBroker({ packageJsonPath: absoluteFilePathContract.parse('/project/packages/web/package.json') });
 * // Returns ContentText description or empty string if unavailable
 *
 * WHEN-TO-USE: When building the project map header line for a package
 */

import { readFileSync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

export const readPackageDescriptionLayerBroker = ({
  packageJsonPath,
}: {
  packageJsonPath: AbsoluteFilePath;
}): ContentText => {
  try {
    const raw = readFileSync(packageJsonPath);
    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'description' in parsed &&
      typeof (parsed as Record<'description', unknown>).description === 'string'
    ) {
      return contentTextContract.parse((parsed as Record<'description', unknown>).description);
    }

    return contentTextContract.parse('');
  } catch {
    return contentTextContract.parse('');
  }
};
