import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';

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
