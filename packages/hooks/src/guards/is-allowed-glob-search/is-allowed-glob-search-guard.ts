/**
 * PURPOSE: Checks if a Glob search should be allowed through (targeting non-TS files or paths outside src)
 *
 * USAGE:
 * isAllowedGlobSearchGuard({ input: GlobToolInputStub({ pattern: 'config/*.json' }) });
 * // Returns true — JSON files are not indexed by discover
 */
import type { GlobToolInput } from '../../contracts/glob-tool-input/glob-tool-input-contract';

const NON_TS_EXTENSION_PATTERN =
  /\*\.(json|md|yaml|yml|css|scss|html|svg|png|jpg|env|sh|toml|lock)$/u;
const OUTSIDE_SRC_PATTERN = /^(dist|node_modules|scripts|\.claude|tests|coverage)\//u;

export const isAllowedGlobSearchGuard = ({ input }: { input?: GlobToolInput }): boolean => {
  if (!input) {
    return false;
  }

  if (NON_TS_EXTENSION_PATTERN.test(String(input.pattern))) {
    return true;
  }

  if (OUTSIDE_SRC_PATTERN.test(String(input.pattern))) {
    return true;
  }

  return false;
};
