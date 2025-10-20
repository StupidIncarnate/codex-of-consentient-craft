/**
 * Extracts filename without extension and suffix.
 * Handles suffixes with extensions (like .proxy.ts) vs without extensions (like -broker).
 * When given an array of suffixes, tries longest suffix first.
 * Example: '/path/to/user-fetch-broker.ts' with suffix '-broker.ts' -> 'user-fetch'
 */
export const filepathBasenameWithoutSuffixTransformer = ({
  filePath,
  suffix,
}: {
  filePath: string;
  suffix: string | readonly string[];
}): string => {
  const parts = filePath.split('/');
  const fullFilename = parts[parts.length - 1] ?? '';

  // For suffixes that include the extension (like .proxy.ts), don't remove extension first
  const suffixIncludesExtension = (s: string): boolean => /\.[^.]+$/u.test(s);

  if (Array.isArray(suffix)) {
    for (const s of suffix) {
      if (suffixIncludesExtension(s)) {
        if (fullFilename.endsWith(s)) {
          return fullFilename.slice(0, -s.length);
        }
      } else {
        const withoutExt = fullFilename.replace(/\.[^.]+$/u, '');
        if (withoutExt.endsWith(s)) {
          return withoutExt.slice(0, -s.length);
        }
      }
    }
  } else if (typeof suffix === 'string') {
    if (suffixIncludesExtension(suffix)) {
      if (fullFilename.endsWith(suffix)) {
        return fullFilename.slice(0, -suffix.length);
      }
    } else {
      const withoutExt = fullFilename.replace(/\.[^.]+$/u, '');
      if (withoutExt.endsWith(suffix)) {
        return withoutExt.slice(0, -suffix.length);
      }
    }
  }

  // Fallback: just remove extension
  return fullFilename.replace(/\.[^.]+$/u, '');
};
