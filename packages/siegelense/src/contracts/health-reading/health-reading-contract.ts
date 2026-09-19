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

import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { healthVerdictContract } from '../health-verdict/health-verdict-contract';
import { hexColourContract } from '../hex-colour/hex-colour-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';

export const healthReadingContract = z
  .object({
    verdict: healthVerdictContract,
    rootPresent: z.boolean(),
    blank: z.boolean(),
    blankColour: hexColourContract.nullable(),
    consoleErrors: readingCountContract,
    firstConsoleError: contentTextContract.nullable(),
    network5xxCount: readingCountContract,
    first5xx: contentTextContract.nullable(),
    serverErrors: readingCountContract,
    firstServerError: contentTextContract.nullable(),
    rendered: contentTextContract,
  })
  .strict();

export type HealthReading = z.infer<typeof healthReadingContract>;
