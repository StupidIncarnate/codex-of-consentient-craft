/**
 * PURPOSE: The three health verdict values — 'HEALTHY', 'DEGRADED', 'DOWN' — computed by
 * healthReadingRenderTransformer to summarize the overall state of the application after a health
 * probe step.
 *
 * USAGE:
 * healthVerdictContract.parse('HEALTHY');
 * // Returns a branded HealthVerdict
 */

import { z } from 'zod';

import { healthStatics } from '../../statics/health/health-statics';

export const healthVerdictContract = z.enum(healthStatics.verdicts.all).brand<'HealthVerdict'>();

export type HealthVerdict = z.infer<typeof healthVerdictContract>;
