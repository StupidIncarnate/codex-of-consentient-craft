/**
 * PURPOSE: Creates a directory and every missing ancestor, always recursive — no production caller
 * in this codebase ever wants a non-recursive mkdir. Resolves silently when the directory already
 * exists.
 *
 * USAGE:
 * await ensureDir('/project/.claude');
 * // Creates every missing directory in the path; resolves without error if it already exists
 */

import { mkdir } from 'fs/promises';

export const ensureDir = async (path: string): Promise<void> => {
  await mkdir(path, { recursive: true });
};
