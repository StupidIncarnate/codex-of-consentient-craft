/**
 * PURPOSE: Names ONE of ward's check types — the word a repair session puts after `--only`. Reach
 * for this over `wardModeContract` (`@dungeonmaster/shared/contracts`): that one names WHICH ward
 * INVOCATION a command work item runs (`changed` / `full`), where this names a check WITHIN a run,
 * read back off the result detail blob's `checks[].checkType`.
 *
 * USAGE:
 * wardCheckTypeContract.parse('typecheck');
 * // Returns: WardCheckType
 *
 * An OPEN branded string rather than a closed enum, deliberately: the check-type set belongs to the
 * ward package, this value arrives as a plain string on a JSON blob ward wrote, and a quest whose
 * blob names a type this enum had not yet grown would fail the whole parse — losing the repair
 * session its entire failing-check list over a word it could have passed straight through.
 */

import { z } from 'zod';

export const wardCheckTypeContract = z.string().min(1).brand<'WardCheckType'>();

export type WardCheckType = z.infer<typeof wardCheckTypeContract>;
