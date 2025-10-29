import { fileBasenameTransformer } from '../file-basename/file-basename-transformer';
import { kebabToCamelCaseTransformer } from '../kebab-to-camel-case/kebab-to-camel-case-transformer';
import { kebabToPascalCaseTransformer } from '../kebab-to-pascal-case/kebab-to-pascal-case-transformer';
import { identifierContract, type Identifier } from '@questmaestro/shared/contracts';

/**
 * PURPOSE: Calculates the expected export name based on filename and folder configuration
 *
 * USAGE:
 * const name = expectedExportNameTransformer({
 *   filename: 'user-fetch-broker.ts',
 *   fileSuffix: '-broker.ts',
 *   exportSuffix: 'Broker',
 *   exportCase: 'camelCase'
 * });
 * // Returns 'userFetchBroker'
 *
 * WHEN-TO-USE: When validating export names match expected patterns from folder config
 */
export const expectedExportNameTransformer = ({
  filename,
  fileSuffix,
  exportSuffix,
  exportCase,
}: {
  filename: string;
  fileSuffix: string | readonly string[];
  exportSuffix: string;
  exportCase: 'camelCase' | 'PascalCase';
}): Identifier => {
  const basename = fileBasenameTransformer({ filename });

  // Remove the file suffix to get the base name
  // Convert basename to plain string for string manipulation
  const suffixes = Array.isArray(fileSuffix) ? fileSuffix : [fileSuffix];
  let baseName = String(basename);

  for (const suffix of suffixes) {
    const suffixStr = String(suffix);
    const suffixWithoutExt = suffixStr.replace(/\.(ts|tsx|js|jsx)$/u, '');
    // Skip empty suffixes (like when fileSuffix is just '.ts')
    if (suffixWithoutExt !== '' && basename.endsWith(suffixWithoutExt)) {
      baseName = basename.slice(0, -suffixWithoutExt.length);
      break;
    }
  }

  // Convert to the expected case
  const convertedName =
    exportCase === 'PascalCase'
      ? kebabToPascalCaseTransformer({ str: baseName })
      : kebabToCamelCaseTransformer({ str: baseName });

  return identifierContract.parse(convertedName + exportSuffix);
};
