/**
 * PURPOSE: Decides whether a value may be joined into a path as ONE directory name — the
 * precondition for treating an id as a literal folder rather than searching the tree for it.
 *
 * USAGE:
 * isSafePathSegmentGuard({ segment: '9d3f1c2a-...' });
 * // Returns true when joining the value cannot reach outside the directory it is joined into
 *
 * WHEN-TO-USE: Before joining any id that arrived from outside the process into a filesystem
 *   path. `questIdContract` and its siblings are `z.string().min(1)` with no format rule, so a
 *   branded id carries no guarantee that it names a single directory.
 */

// Three ways a value fails to name one child directory, in one pattern:
//   [/\\]  a separator makes it more than one segment
//   \0     a NUL byte makes Node's fs layer THROW rather than report a miss, which would turn
//          a malformed id into a crash instead of a not-found
//   ^\.\.?$  `.` and `..` are the two names that resolve somewhere other than a child
const UNSAFE_SEGMENT_PATTERN = /[/\\\0]|^\.\.?$/u;

export const isSafePathSegmentGuard = ({ segment }: { segment?: string }): boolean => {
  if (!segment) {
    return false;
  }

  return !UNSAFE_SEGMENT_PATTERN.test(segment);
};
