/**
 * PURPOSE: The ephemeral, element-bound handle a `look` mints — a positive integer that means one
 * element inside ONE instance, in ONE page state. Reach for this over `selectorContract` when the
 * value is DRIVING something right now in this session; reach for a Selector when the value is
 * RECORDING — anything saved, re-run, briefed, or written into a record
 * (siegelense-tooling.md line 2168, "Refs are for DRIVING. Selectors are for RECORDING").
 *
 * Four boundaries a ref cannot cross, and every one of them looks like it should work
 * (siegelense-tooling.md lines 2187-2194): a minion handing one to its parent, a parent handing one
 * to a fixer, a walk handing one to its re-walk, and a happy phase handing one to an adversarial
 * one. The instance holds the element handles, so the instance is the only thing in the system that
 * can resolve a ref at all — nobody else has anything to look one up in. That is why a stored ref is
 * worse than a broken one: `ref: 14` may legitimately exist in the inheriting instance and point at
 * a different element, so it drives the wrong thing and hands back a clean-looking result.
 *
 * USAGE:
 * refContract.parse(23);
 * // Returns a branded Ref
 */

import { z } from 'zod';

export const refContract = z.number().int().positive().brand<'Ref'>();

export type Ref = z.infer<typeof refContract>;
