/**
 * PURPOSE: Rendered duplicate-install report text — either one violation's block, or the whole run's
 * report joining every block. Standalone brand so both `duplicateInstallViolationDisplayTransformer`
 * and `duplicateInstallReportTransformer` return the same typed text rather than each inventing its own.
 *
 * USAGE:
 * duplicateInstallDisplayTextContract.parse('@mantine/core installed at 2 locations...');
 * // Returns branded DuplicateInstallDisplayText
 */

import { z } from 'zod';

export const duplicateInstallDisplayTextContract = z
  .string()
  .brand<'DuplicateInstallDisplayText'>();

export type DuplicateInstallDisplayText = z.infer<typeof duplicateInstallDisplayTextContract>;
