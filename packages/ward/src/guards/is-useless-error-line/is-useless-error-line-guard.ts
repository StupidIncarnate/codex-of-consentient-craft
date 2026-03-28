/**
 * PURPOSE: Checks if an error message line contains only timeout noise with no diagnostic value
 *
 * USAGE:
 * isUselessErrorLineGuard({ line: 'Error: thrown: "' });
 * // Returns true — this line has no diagnostic value
 */

const USELESS_LINE_PATTERNS = [
  /^Error: thrown: "/u,
  /^thrown: "/u,
  /^"\s*$/u,
  /^\s*$/u,
  /^Add a timeout value to this test/u,
  /^See https:\/\/jestjs\.io/u,
];

export const isUselessErrorLineGuard = ({ line }: { line?: string }): boolean => {
  if (!line) {
    return true;
  }

  return USELESS_LINE_PATTERNS.some((pattern) => pattern.test(line));
};
