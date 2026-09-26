/**
 * PURPOSE: Captures the path to the Node executable running this process. Reach for this
 * over `process.execPath` directly so a raw-import lint rule has one name per call site to
 * catch.
 *
 * USAGE:
 * const nodeBinary = execPath;
 * // Same value process.execPath holds
 */

export const { execPath } = process;
