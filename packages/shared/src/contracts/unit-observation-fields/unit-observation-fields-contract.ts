/**
 * PURPOSE: The bare, unrefined fields of a unit observation — which unit, what mark, the evidence,
 * and the optional toSettle instruction. Split out of `unitObservationContract` (its sibling folder)
 * because `.superRefine()` returns a `ZodEffects` in zod 3, which carries no `.shape`/`.omit`/`.pick`/
 * `.extend`. Story 17 needs `.omit({ at: true })` for an inbound payload the caller has not yet
 * timestamped; story 18 needs `.shape.evidence` / `.shape.toSettle` to reuse their `.describe()` text
 * without re-typing it. Both are impossible against the refined export alone, so this bare object is
 * the one either of them parses through.
 *
 * USAGE:
 * unitObservationFieldsContract.parse({
 *   unitId: 'send-flow:observable:check-badge-count-text',
 *   mark: 'met',
 *   evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
 *   at: '2026-01-01T00:00:00.000Z',
 * });
 * // Returns: UnitObservationFields — parses the same values `unitObservationContract` does, minus
 * // the cant-meet/toSettle pairing rule
 */

import { z } from 'zod';

import { unitIdContract } from '../unit-id/unit-id-contract';
import { unitMarkContract } from '../unit-mark/unit-mark-contract';

export const unitObservationFieldsContract = z.object({
  unitId: unitIdContract,
  mark: unitMarkContract,
  evidence: z
    .string()
    .min(1)
    .brand<'MarkEvidence'>()
    .describe(
      'What settles this mark. met: a test file:line and the wrong value that turns it red, or ' +
        'the value measured off the running system. cant-meet: why this layer cannot reach it. ' +
        'unmet: what is left, and what this session already learned — that note reaches its successor.',
    ),
  toSettle: z
    .string()
    .min(1)
    .brand<'ToSettleInstruction'>()
    .optional()
    .describe(
      'The action that WOULD settle this unit. Required when mark is cant-meet; refused otherwise ' +
        '— an instruction, never a question, naming what to DO rather than what to answer.',
    ),
  // Inline-branded, not a shared `isoTimestampContract` — `shared` has none. Every timestamp field
  // in this package brands `z.string().datetime().brand<'IsoTimestamp'>()` at its own declaration
  // site; see `work-item-contract.ts:46,52,63` for three examples in one file. `packages/orchestrator`,
  // `packages/web`, `packages/server` and `packages/session-forensics` each keep their OWN local
  // `isoTimestampContract` for their own package's consumers — none of those is importable from
  // `shared` (shared is the base package; nothing above it may be depended on from here).
  at: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type UnitObservationFields = z.infer<typeof unitObservationFieldsContract>;
