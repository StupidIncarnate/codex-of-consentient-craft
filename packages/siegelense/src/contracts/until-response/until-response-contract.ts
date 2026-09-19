/**
 * PURPOSE: The `response` condition an `until` step waits on — an HTTP method plus a path matched
 * as a SUBSTRING of the recorded url, the same match `results { kind: 'network', where: { path } }`
 * already does (`buffer-read-layer-broker.ts`). Grouped into its own contract rather than two loose
 * top-level fields on the step itself, so `stepContract`'s `.strict()` rejects an unknown key under
 * `response` as THIS contract's problem rather than the step's own.
 *
 * USAGE:
 * untilResponseContract.parse({ method: 'POST', path: '/api/quests' });
 * // Returns a validated UntilResponse
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { httpMethodContract } from '../http-method/http-method-contract';

export const untilResponseContract = z
  .object({
    method: httpMethodContract,
    path: contentTextContract,
  })
  .strict();

export type UntilResponse = z.infer<typeof untilResponseContract>;
