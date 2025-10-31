/**
 * PURPOSE: Checks if a name ends with a folder type suffix pattern from folder config
 *
 * USAGE:
 * if (hasFolderTypeSuffixGuard({ name: 'foo-broker' })) {
 *   // name ends with a valid folder type suffix like -broker, -adapter, -guard
 * }
 * // Returns true if name matches any configured folder type suffix
 */
import { folderConfigStatics } from '@questmaestro/shared/statics';

export const hasFolderTypeSuffixGuard = ({ name }: { name?: string }): boolean => {
  if (!name) {
    return false;
  }

  // Extract suffixes from folder configs (e.g., '-broker', '-adapter', '-guard')
  const suffixes = [];
  for (const config of Object.values(folderConfigStatics)) {
    const { fileSuffix } = config;
    const suffixArray = Array.isArray(fileSuffix) ? fileSuffix : [fileSuffix];

    for (const suffixItem of suffixArray) {
      // Ensure we're working with strings
      const suffix = String(suffixItem);

      // Remove .ts/.tsx extension and extract the suffix part
      // e.g., '-broker.ts' -> '-broker', '.stub.ts' -> ignore (starts with dot)
      const withoutExtension = suffix.replace(/\.tsx?$/u, '');
      if (withoutExtension.startsWith('-')) {
        // Remove leading dash for pattern matching
        suffixes.push(withoutExtension.slice(1));
      }
    }
  }

  const pattern = new RegExp(`-(${suffixes.join('|')})$`, 'u');

  return pattern.test(name);
};
