import { identifierContract, type Identifier } from '@questmaestro/shared/contracts';

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
}): Identifier => {
  const parts = filePath.split('/');
  const fullFilename = parts[parts.length - 1] ?? '';

  // For suffixes that include the extension (like .proxy.ts), don't remove extension first
  const suffixIncludesExtension = /\.[^.]+$/u;

  if (Array.isArray(suffix)) {
    for (const s of suffix) {
      const sStr = String(s);
      if (suffixIncludesExtension.test(sStr)) {
        if (fullFilename.endsWith(sStr)) {
          return identifierContract.parse(fullFilename.slice(0, -sStr.length));
        }
      } else {
        const withoutExt = fullFilename.replace(/\.[^.]+$/u, '');
        if (withoutExt.endsWith(sStr)) {
          return identifierContract.parse(withoutExt.slice(0, -sStr.length));
        }
      }
    }
  } else if (typeof suffix === 'string') {
    if (suffixIncludesExtension.test(suffix)) {
      if (fullFilename.endsWith(suffix)) {
        return identifierContract.parse(fullFilename.slice(0, -suffix.length));
      }
    } else {
      const withoutExt = fullFilename.replace(/\.[^.]+$/u, '');
      if (withoutExt.endsWith(suffix)) {
        return identifierContract.parse(withoutExt.slice(0, -suffix.length));
      }
    }
  }

  // Fallback: just remove extension
  return identifierContract.parse(fullFilename.replace(/\.[^.]+$/u, ''));
};
