/**
 * PURPOSE: Defines the BinEntry structure representing a single bin entry from a
 * hook-handlers package.json — the bin name and the path to its compiled entry point.
 *
 * USAGE:
 * binEntryContract.parse({
 *   binName: contentTextContract.parse('dungeonmaster-pre-edit-lint'),
 *   binPath: contentTextContract.parse('./dist/src/startup/start-pre-edit-hook.js'),
 * });
 * // Returns validated BinEntry
 *
 * WHEN-TO-USE: Building the Hooks section of the hook-handlers headline renderer
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const binEntryContract = z.object({
  binName: contentTextContract,
  binPath: contentTextContract,
});

export type BinEntry = z.infer<typeof binEntryContract>;
