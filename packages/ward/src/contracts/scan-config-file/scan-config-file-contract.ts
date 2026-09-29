/**
 * PURPOSE: Points at the generated ESLint wrapper config a scan runs under and the temp directory
 * that holds it, so the directory can be removed once the scan ends. Reach for this over the
 * repo's own `eslint.config.js`, which a scan never edits.
 *
 * USAGE:
 * scanConfigFileContract.parse({ directory: '/tmp/ward-scan-a1B2c3', path: '/tmp/ward-scan-a1B2c3/eslint.scan.config.cjs' });
 * // Returns: ScanConfigFile validated object
 */

import { z } from '#gateway/npm/zod';

export const scanConfigFileContract = z.object({
  directory: z.string().min(1).brand<'ScanConfigDirectory'>(),
  path: z.string().min(1).brand<'ScanConfigPath'>(),
});

export type ScanConfigFile = z.infer<typeof scanConfigFileContract>;
