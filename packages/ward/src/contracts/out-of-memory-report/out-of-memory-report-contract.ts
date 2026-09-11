/**
 * PURPOSE: One check that died of memory, rendered for the summary — the package, the exit code or
 * signal it died on, and which of the three pieces of evidence said so. Reach for this rather than
 * the raw `ProjectResult` wherever the failure is being EXPLAINED, because the explanation is the
 * whole point: the exit code alone reads as an ordinary tool failure.
 *
 * USAGE:
 * outOfMemoryReportContract.parse('  ward  exit 134  V8 heap limit ...');
 * // Returns a branded OutOfMemoryReport
 */

import { z } from 'zod';

export const outOfMemoryReportContract = z.string().brand<'OutOfMemoryReport'>();

export type OutOfMemoryReport = z.infer<typeof outOfMemoryReportContract>;
