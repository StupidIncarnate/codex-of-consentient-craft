/**
 * PURPOSE: Validates ESLint's JSON stdout as an array while keeping every entry exactly as ESLint wrote it,
 * key order included, non-object entries too. Reach for eslintJsonReportContract instead when the entry's
 * fields are read; this one exists for eslintStatsStripTransformer, which rewrites the entries and must
 * hand back the rest of each one untouched.
 *
 * USAGE:
 * eslintRawReportContract.parse(JSON.parse(slice));
 * // Returns the entries untouched, one per linted file
 */

import { z } from '#gateway/npm/zod';

export const eslintRawReportContract = z.array(z.unknown());

export type EslintRawReport = z.infer<typeof eslintRawReportContract>;
