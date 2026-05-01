/**
 * PURPOSE: Extracts fsWatchTailAdapter call sites from TypeScript source text using regex,
 * returning the literal filePath argument or a computed broker reference
 *
 * USAGE:
 * const calls = fsWatchTailCallsExtractTransformer({
 *   source: contentTextContract.parse('fsWatchTailAdapter({ filePath: outboxPath, onLine })'),
 * });
 * // Returns [{ filePathArg: '<computed: outboxPath>' }] when path is a variable
 *
 * WHEN-TO-USE: File-bus-edges broker scanning source files for fsWatchTailAdapter call sites
 * to extract their filePath arguments and join with write-side call sites
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import type { FsWatchTailCall } from '../../contracts/fs-watch-tail-call/fs-watch-tail-call-contract';

// Matches: fsWatchTailAdapter({ filePath: 'literal' }) or fsWatchTailAdapter({ filePath: brokerName(...) })
// or fsWatchTailAdapter({ filePath: someVariable, ... })
// Capture groups: 1=single-quoted 2=double-quoted 3=backtick-content 4=broker-name (has paren) 5=bare var
const backtickSegment = '`([^`]*)`';
const FS_WATCH_TAIL_PATTERN = new RegExp(
  `\\bfsWatchTailAdapter\\s*\\(\\s*\\{[^}]*?filePath\\s*:\\s*(?:'([^']*)'|"([^"]*)"|${backtickSegment}|(\\w+)\\s*\\(|(\\w+)\\b)`,
  'gu',
);

export const fsWatchTailCallsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): FsWatchTailCall[] => {
  const results: FsWatchTailCall[] = [];
  FS_WATCH_TAIL_PATTERN.lastIndex = 0;
  let match = FS_WATCH_TAIL_PATTERN.exec(String(source));
  while (match !== null) {
    const [, singleQuoted, doubleQuoted, backticked, brokerName, bareVar] = match;

    const computedName = brokerName ?? bareVar;
    const computedArg = computedName === undefined ? undefined : `<computed: ${computedName}>`;
    const rawArg = singleQuoted ?? doubleQuoted ?? backticked ?? computedArg;

    if (rawArg !== undefined) {
      results.push({ filePathArg: contentTextContract.parse(rawArg) });
    }

    match = FS_WATCH_TAIL_PATTERN.exec(String(source));
  }
  return results;
};
