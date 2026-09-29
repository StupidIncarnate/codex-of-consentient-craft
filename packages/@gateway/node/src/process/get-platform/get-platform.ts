/**
 * PURPOSE: Reads the process's platform at call time. Reach for this over `process.platform`
 * (or the load-time `platform` capture) when a caller branches on the platform and a test must
 * be able to stage each branch.
 *
 * USAGE:
 * const current = getPlatform();
 * // 'darwin', 'win32', 'linux', ... — whatever process.platform holds right now
 */

export const getPlatform = (): NodeJS.Platform => process.platform;
