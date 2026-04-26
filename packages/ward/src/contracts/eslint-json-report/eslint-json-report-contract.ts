/**
 * PURPOSE: Validates the top-level ESLint JSON output array (one entry per file)
 *
 * USAGE:
 * eslintJsonReportContract.parse(JSON.parse(eslintJsonString));
 * // Returns: EslintJsonReport array of per-file entries
 */

import { z } from 'zod';

import { eslintJsonReportEntryContract } from '../eslint-json-report-entry/eslint-json-report-entry-contract';

export const eslintJsonReportContract = z.array(eslintJsonReportEntryContract);

export type EslintJsonReport = z.infer<typeof eslintJsonReportContract>;
