/**
 * PURPOSE: A repo-relative path with forward slashes, as the census prints it, so a path read from one machine diffs cleanly against a run on another. Reach for this over absoluteFilePathContract for anything the census reports.
 *
 * USAGE:
 * censusPathContract.parse('packages/siegelense/src/adapters/fs/read-file/fs-read-file-adapter.ts');
 * // Returns: CensusPath (branded string)
 */
import { z } from '#gateway/npm/zod';

export const censusPathContract = z.string().min(1).brand<'CensusPath'>();

export type CensusPath = z.infer<typeof censusPathContract>;
