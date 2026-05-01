/**
 * PURPOSE: Detects fs-write calls (writeFile, appendFile, writeFileSync, appendFileSync)
 * in TypeScript source text and returns the first found path literal argument, or '(file)'
 * if a write call is found but no literal path argument is present. Returns undefined
 * when no fs-write call is detected.
 *
 * USAGE:
 * const path = hookFsWritePathExtractTransformer({ source: contentTextContract.parse(src) });
 * // Returns ContentText('.claude/settings.json') or undefined if no write calls found
 *
 * WHEN-TO-USE: hook-handlers headline renderer detecting file-system writes in startup/responder source
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const FS_WRITE_CALL_PATTERN =
  /\b(?:writeFileSync|appendFileSync|writeFile|appendFile|fsWriteFileAdapter|fsAppendFileAdapter|fsMkdirAdapter)\s*\(/u;
const QUOTED_PATH_AFTER_CALL_PATTERN =
  /\b(?:writeFileSync|appendFileSync|writeFile|appendFile|fsWriteFileAdapter|fsAppendFileAdapter|fsMkdirAdapter)\s*\(\s*['"`]([^'"`]+)['"`]/u;

export const hookFsWritePathExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText | undefined => {
  const src = String(source);
  const withLiteralMatch = QUOTED_PATH_AFTER_CALL_PATTERN.exec(src);
  if (withLiteralMatch !== null) {
    return contentTextContract.parse(withLiteralMatch[1] ?? '(file)');
  }
  if (FS_WRITE_CALL_PATTERN.test(src)) {
    return contentTextContract.parse('(file)');
  }
  return undefined;
};
