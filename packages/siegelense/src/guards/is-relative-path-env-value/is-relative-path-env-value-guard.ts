/**
 * PURPOSE: True when an already-placeholder-substituted `devServer.e2e.processes[].env` value looks
 * like a repo-relative file path rather than an ordinary env value — a port number, a flag, an
 * already-absolute path, or a resolved `{apiWorkspace}`/`{webWorkspace}` token (an npm scope like
 * `@dungeonmaster/server`, excluded by its leading `@` so it is never mistaken for one). Reach for
 * this from `laneEnvSubstituteTransformer`, the one place a value this guard approves gets resolved
 * against the repo root.
 *
 * USAGE:
 * isRelativePathEnvValueGuard({ value: 'packages/web/test/harnesses/claude-mock/bin/claude' });
 * // Returns true
 *
 * isRelativePathEnvValueGuard({ value: '500' });
 * // Returns false — no path separator
 */

export const isRelativePathEnvValueGuard = ({ value }: { value?: string }): boolean => {
  if (!value) {
    return false;
  }
  return !value.startsWith('/') && !value.startsWith('@') && value.includes('/');
};
