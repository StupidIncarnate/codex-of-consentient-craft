/**
 * PURPOSE: Rendered platform-crossing report text — either one violation's two-line block, or the
 * whole run's report joining every block. Standalone brand so both
 * `platformCrossingViolationDisplayTransformer` and `platformCrossingReportTransformer` return the
 * same typed text rather than each inventing its own.
 *
 * USAGE:
 * platformCrossingDisplayTextContract.parse('web (browser) -> ...');
 * // Returns branded PlatformCrossingDisplayText
 */

import { z } from 'zod';

export const platformCrossingDisplayTextContract = z
  .string()
  .brand<'PlatformCrossingDisplayText'>();

export type PlatformCrossingDisplayText = z.infer<typeof platformCrossingDisplayTextContract>;
