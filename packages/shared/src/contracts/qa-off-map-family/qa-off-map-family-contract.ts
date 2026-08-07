/**
 * PURPOSE: Defines the seven off-map probe families every quest flow is checked against — the
 * breakage classes a flow graph structurally cannot draw, because a graph only shows the paths its
 * author imagined
 *
 * USAGE:
 * qaOffMapFamilyContract.parse('concurrency');
 * // Returns: QaOffMapFamily enum value
 *
 * The checklist enumerator emits one `off-map` unit per family per flow, so a family can only leave
 * the ledger carrying a real observation or an explicit justified `gap` — never a silent omission.
 */

import { z } from 'zod';

export const qaOffMapFamilyContract = z.enum([
  're-entry',
  'concurrency',
  'interruption',
  'staleness',
  'configuration',
  'hostile-input',
  'perf',
]);

export type QaOffMapFamily = z.infer<typeof qaOffMapFamilyContract>;
