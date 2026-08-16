/**
 * PURPOSE: Translates a repo's .gitignore into glob ignore patterns, so discover skips the scratch
 * a repo already refuses to track (tmp/, worktrees/, coverage/) without anyone hardcoding those
 * names. Reach for this over extending `fileDiscoveryStatics.globIgnorePatterns`, which carries only
 * the rules that hold for every repo whether or not it keeps a .gitignore at all.
 *
 * Negation lines are dropped rather than translated: glob's ignore option is a flat pattern list
 * with no "except this" form, so a `!keep-me` line translated naively would ignore the one path its
 * author wrote it to preserve.
 *
 * USAGE:
 * gitignoreToGlobTransformer({ contents: FileContentsStub({ value: 'dist\nworktrees/\n' }) });
 * // Returns ['**\/dist', '**\/dist\/**', '**\/worktrees\/**']
 */

import { globPatternContract } from '@dungeonmaster/shared/contracts';
import type { FileContents, GlobPattern } from '@dungeonmaster/shared/contracts';

const COMMENT_PREFIX = '#';
const NEGATION_PREFIX = '!';
const PATH_SEPARATOR = '/';
const WILDCARD_PATTERN = /[*?[\]]/u;
const NO_PATTERNS: readonly GlobPattern[] = [];

export const gitignoreToGlobTransformer = ({
  contents,
}: {
  contents: FileContents;
}): readonly GlobPattern[] =>
  String(contents)
    .split('\n')
    .flatMap((rawLine) => {
      const line = rawLine.trim();

      if (line === '' || line.startsWith(COMMENT_PREFIX) || line.startsWith(NEGATION_PREFIX)) {
        return NO_PATTERNS;
      }

      // A trailing slash is git's "directories only" marker; a leading slash anchors the pattern to
      // the .gitignore's own directory, which is the scan root.
      const isDirectoryOnly = line.endsWith(PATH_SEPARATOR);
      const unsuffixed = isDirectoryOnly ? line.slice(0, -1) : line;
      const isAnchored = unsuffixed.startsWith(PATH_SEPARATOR);
      const core = isAnchored ? unsuffixed.slice(1) : unsuffixed;

      if (core === '') {
        return NO_PATTERNS;
      }

      // git treats any pattern containing a slash as anchored too, so only a bare name floats.
      const base = isAnchored || core.includes(PATH_SEPARATOR) ? core : `**/${core}`;

      if (isDirectoryOnly) {
        return [globPatternContract.parse(`${base}/**`)];
      }

      // A bare name matches a file OR a directory in git, and glob needs one pattern for each.
      // A line that already carries a wildcard is passed through exactly as its author wrote it.
      return WILDCARD_PATTERN.test(core)
        ? [globPatternContract.parse(base)]
        : [globPatternContract.parse(base), globPatternContract.parse(`${base}/**`)];
    });
