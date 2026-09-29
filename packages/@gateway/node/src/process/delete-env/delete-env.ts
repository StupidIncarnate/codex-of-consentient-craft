/**
 * PURPOSE: Removes one environment variable from the running process. Deleting a name that is not
 * set is a no-op, so a test can call it unconditionally in its cleanup.
 *
 * USAGE:
 * deleteEnv('DUNGEONMASTER_HOME');
 * // process.env no longer has the key at all — getEnv returns undefined, not an empty string
 */

export const deleteEnv = (name: string): void => {
  Reflect.deleteProperty(process.env, name);
};
