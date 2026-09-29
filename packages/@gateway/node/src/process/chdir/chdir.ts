/**
 * PURPOSE: Changes the process's current working directory. Reach for this over `process.chdir`
 * directly so callers go through the gateway's one sanctioned wrapper; it throws Node's own
 * ENOENT/ENOTDIR error for a directory that is not there.
 *
 * USAGE:
 * chdir('/tmp/some-project');
 * // process.cwd() and every relative path afterwards resolve from /tmp/some-project
 */

export const chdir = (directory: string): void => {
  process.chdir(directory);
};
