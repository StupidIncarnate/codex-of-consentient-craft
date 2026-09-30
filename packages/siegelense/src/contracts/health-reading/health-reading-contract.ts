/**
 * PURPOSE: The structured reading produced by the `health` step verb, containing component checks
 * (root presence, page blankness, console errors, 5xx responses, server log errors), the overall
 * computed verdict, and the formatted single-line rendered text.
 *
 * USAGE:
 * healthReadingContract.parse({
 *   verdict: 'HEALTHY',
 *   rootPresent: true,
 *   blank: false,
 *   blankColour: null,
 *   consoleErrors: 0,
 *   firstConsoleError: null,
 *   network5xxCount: 0,
 *   first5xx: null,
 *   serverErrors: 0,
 *   firstServerError: null,
 *   rendered: 'HEALTHY   root present · not blank · console clean · no 5xx · server log clean',
 * });
 */

import { z } from '#gateway/npm/zod';

import { healthVerdictContract } from '../health-verdict/health-verdict-contract';

export const healthReadingContract = z
  .object({
    verdict: healthVerdictContract,
    rootPresent: z.boolean(),
    blank: z.boolean(),
    blankColour: z.string().regex(/^#[0-9a-f]{6}$/u).brand<'HealthReadingBlankColour'>().nullable(),
    consoleErrors: z.number().int().nonnegative().brand<'HealthReadingConsoleErrors'>(),
    firstConsoleError: z.string().brand<'HealthReadingFirstConsoleError'>().nullable(),
    network5xxCount: z.number().int().nonnegative().brand<'HealthReadingNetwork5xxCount'>(),
    first5xx: z.string().brand<'HealthReadingFirst5xx'>().nullable(),
    serverErrors: z.number().int().nonnegative().brand<'HealthReadingServerErrors'>(),
    firstServerError: z.string().brand<'HealthReadingFirstServerError'>().nullable(),
    rendered: z.string().brand<'HealthReadingRendered'>(),
  })
  .strict();

export type HealthReading = z.infer<typeof healthReadingContract>;
