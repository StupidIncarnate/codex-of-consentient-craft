/**
 * PURPOSE: Creates a fresh, uniquely named directory and returns its path. Node appends six random
 * characters to `prefix`, so `prefix` is a full path ending in the name's fixed part, not a
 * parent directory. Every OS error passes through raw.
 *
 * USAGE:
 * const dir = mkdtempSync('/tmp/dm-e2e-images-');
 * // Returns '/tmp/dm-e2e-images-a1B2c3', a directory that did not exist before the call
 */
import { mkdtempSync as nodeMkdtempSync } from 'fs';

export const mkdtempSync = (prefix: string): string => nodeMkdtempSync(prefix);
