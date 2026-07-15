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
  const withoutExt = fullFilename.replace(/\.[^.]+$/u, '');
  const suffixes = Array.isArray(suffix) ? suffix.map((s) => String(s)) : [String(suffix)];

  for (const candidate of suffixes) {
    if (suffixIncludesExtension.test(candidate)) {
      if (fullFilename.endsWith(candidate)) {
        return identifierContract.parse(fullFilename.slice(0, -candidate.length));
      }

      // Extension differs but the stem still marks where the base ends. Callers append
      // the canonical suffix to this base, so a base that kept its own suffix would
      // double it — 'user-profile-responder' + '-responder'.
      const stem = candidate.replace(/\.[^.]+$/u, '');
      if (withoutExt.endsWith(stem)) {
        return identifierContract.parse(withoutExt.slice(0, -stem.length));
      }
    } else if (withoutExt.endsWith(candidate)) {
      return identifierContract.parse(withoutExt.slice(0, -candidate.length));
    }
  }

  // Fallback: just remove extension
  return identifierContract.parse(withoutExt);
};
