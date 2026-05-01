/**
 * PURPOSE: Extracts the subprocess name from a spawn() call in TypeScript source text.
 * Returns the first string literal argument to spawn/spawnSync as a ContentText, or
 * '(subprocess)' if a spawn call is found but the argument is not a literal. Returns
 * undefined when no spawn call is detected.
 *
 * USAGE:
 * const name = hookSpawnNameExtractTransformer({ source: contentTextContract.parse(src) });
 * // Returns ContentText('npm') for `spawnSync('npm', ['run', 'build'])`, or undefined if no spawn found
 *
 * WHEN-TO-USE: hook-handlers headline renderer detecting subprocess spawning in startup/responder source
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const SPAWN_WITH_LITERAL_PATTERN = /\bspawn(?:Sync)?\s*\(\s*['"`]([^'"`]+)['"`]/u;
const SPAWN_CALL_PATTERN = /\bspawn(?:Sync)?\s*\(/u;

export const hookSpawnNameExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText | undefined => {
  const src = String(source);
  const withLiteralMatch = SPAWN_WITH_LITERAL_PATTERN.exec(src);
  if (withLiteralMatch !== null) {
    return contentTextContract.parse(withLiteralMatch[1] ?? '(subprocess)');
  }
  if (SPAWN_CALL_PATTERN.test(src)) {
    return contentTextContract.parse('(subprocess)');
  }
  return undefined;
};
