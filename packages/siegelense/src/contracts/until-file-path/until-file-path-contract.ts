/**
 * PURPOSE: The `file` condition an `until` step waits on — a path resolved against the LANE'S OWN
 * throwaway home (`DUNGEONMASTER_HOME` for that process), never an absolute one. The spec's own
 * example, `guilds/<id>/quests/<id>/quest.json`, is home-relative because that is where the app
 * writes when the lane's home points at it; a value starting with "/" is refused rather than
 * silently waited on outside the lane the walk is driving.
 *
 * USAGE:
 * untilFilePathContract.parse('guilds/g1/quests/q1/quest.json');
 * // Returns a branded UntilFilePath
 */

import { z } from 'zod';

export const untilFilePathContract = z
  .string()
  .min(1)
  .refine((candidate) => !candidate.startsWith('/'), {
    message:
      'an `until { file }` path is resolved against the lane\'s own throwaway home and must not start with "/" — a leading slash would silently wait on a file outside the lane the walk is driving. Try { "step": "until", "file": "guilds/<id>/quests/<id>/quest.json" }',
  })
  .brand<'UntilFilePath'>();

export type UntilFilePath = z.infer<typeof untilFilePathContract>;
