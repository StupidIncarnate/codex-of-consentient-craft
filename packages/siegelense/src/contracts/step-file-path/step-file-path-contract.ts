/**
 * PURPOSE: Validates and brands a file path for the `file` step verb — a path resolved against the
 * lane's own throwaway home directory (`lane.homePath`), never an absolute path and never escaping
 * via directory traversal. Reach for this over `untilFilePathContract` (which only checks leading
 * slashes) when executing a `file` step that reads arbitrary file contents from disk.
 *
 * USAGE:
 * stepFilePathContract.parse('guilds/g1/quests/q1/quest.json');
 * // Returns a branded StepFilePath
 */

import { z } from 'zod';

import { fileStatics } from '../../statics/file/file-statics';

export const stepFilePathContract = z
  .string()
  .min(1)
  .refine((candidate) => !candidate.startsWith('/'), {
    message: fileStatics.errors.leadingSlash,
  })
  .refine((candidate) => !candidate.split('/').includes('..'), {
    message: fileStatics.errors.traversal,
  })
  .brand<'StepFilePath'>();

export type StepFilePath = z.infer<typeof stepFilePathContract>;
