/**
 * PURPOSE: Sets one environment variable on the running process. Keeps `getEnv`'s positional
 * shape. The value is a string because the environment only holds strings.
 *
 * USAGE:
 * setEnv('DUNGEONMASTER_HOME', '/tmp/dm-test');
 * // Sets process.env.DUNGEONMASTER_HOME; every child spawned afterwards inherits it
 */

export const setEnv = (name: string, value: string): void => {
  process.env[name] = value;
};
