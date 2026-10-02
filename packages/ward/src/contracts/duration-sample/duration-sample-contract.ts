/**
 * PURPOSE: Defines the execution duration and resource sample structure for package checks
 *
 * USAGE:
 * durationSampleContract.parse({
 *   repoRoot: '/home/user/project',
 *   packageName: 'ward',
 *   checkType: 'unit',
 *   durationMs: 1200,
 *   peakRssMB: null,
 *   shards: null,
 *   recordedAtMs: 1700000000000,
 * });
 * // Returns: DurationSample validated object
 */

import { z } from '#gateway/npm/zod';
import { checkTypeContract } from '../check-type/check-type-contract';
import { projectFolderContract } from '../project-folder/project-folder-contract';

export const durationSampleContract = z
  .object({
    repoRoot: z.string().min(1).brand<'DurationSampleRepoRoot'>(),
    packageName: projectFolderContract.shape.name,
    checkType: checkTypeContract,
    durationMs: z.number().nonnegative().brand<'DurationSampleDurationMs'>(),
    peakRssMB: z.number().brand<'DurationSamplePeakRssMB'>().nullable(),
    shards: z.number().brand<'DurationSampleShards'>().nullable(),
    recordedAtMs: z.number().brand<'DurationSampleRecordedAtMs'>(),
  })
  .brand<'DurationSample'>();

export type DurationSample = z.infer<typeof durationSampleContract>;
