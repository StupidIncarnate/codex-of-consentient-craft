/**
 * PURPOSE: Extracts filename without extension and type suffix
 *
 * USAGE:
 * const base = filepathBasenameWithoutSuffixTransformer({
 *   filePath: '/path/to/user-fetch-broker.ts',
 *   suffix: '-broker.ts'
 * });
 * // Returns 'user-fetch'
 * const base2 = filepathBasenameWithoutSuffixTransformer({
 *   filePath: 'file.proxy.ts',
 *   suffix: '.proxy.ts'
 * });
 * // Returns 'file'
 *
 * WHEN-TO-USE: When extracting base names for folder structure validation
 */
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';

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
