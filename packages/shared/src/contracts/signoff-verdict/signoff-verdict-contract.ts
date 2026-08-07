/**
 * PURPOSE: Defines the two verdicts a single verification sign-off can carry
 *
 * USAGE:
 * signoffVerdictContract.parse('confirmed');
 * // Returns: SignoffVerdict enum value
 *
 * A unit carries two INDEPENDENT sign-offs — one from Flowrider, one from Siegemaster — and there
 * is no aggregate status anywhere; each track answers for itself. `confirmed` means the unit holds
 * WITH EVIDENCE: for Flowrider that is the test `file:line` plus what makes it fail, for Siegemaster
 * it is the value measured off the running system. `unconfirmable` means genuinely unable to confirm
 * after real effort, and it requires saying what was tried and why it could not be confirmed.
 *
 * There is deliberately NO `defect`/`deferred`/`gap`/`recorded` verdict. A measured defect is not a
 * verdict on this unit — it is a NEW observable (the inverse expectation) added to the flow, which
 * then carries its own two sign-offs. Keeping the enum at two members means a defect can never be
 * parked as a terminal state on the unit that found it.
 */

import { z } from 'zod';

export const signoffVerdictContract = z.enum(['confirmed', 'unconfirmable']);

export type SignoffVerdict = z.infer<typeof signoffVerdictContract>;
