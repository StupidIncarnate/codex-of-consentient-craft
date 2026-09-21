/**
 * PURPOSE: Identifies ONE verification unit — a terminal, a labelled branch, an observable, or an
 * off-map probe family — in the flow-scoped, derived shape `qaUnitEnumerateTransformer` already
 * produces: `<flowId>:<kind>:<localId>`.
 *
 * USAGE:
 * unitIdContract.parse('send-flow:observable:check-badge-count-text');
 * // Returns a branded UnitId
 *
 * A NEW brand rather than a re-export of `qaChecklistItemIdContract` — that contract belongs to the
 * old three-track sign-off machinery (`qaVerificationUnitContract` and everything built on it), which
 * this change does not touch. The two validate byte-identically today; whether they merge is an open
 * question for whoever retires the sign-off machinery.
 */

import { z } from 'zod';

const KEBAB_SEGMENT = '[a-z][a-z0-9]*(?:-[a-z0-9]+)*';

export const unitIdContract = z
  .string()
  .min(1)
  .regex(new RegExp(`^${KEBAB_SEGMENT}:${KEBAB_SEGMENT}:${KEBAB_SEGMENT}$`, 'u'))
  .brand<'UnitId'>();

export type UnitId = z.infer<typeof unitIdContract>;
