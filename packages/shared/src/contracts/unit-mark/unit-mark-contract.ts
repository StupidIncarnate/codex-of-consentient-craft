/**
 * PURPOSE: Defines the three-way outcome a session records against one unit — `met` and `cant-meet`
 * both settle it, `unmet` means real work remains. Replaces the mismatched vocabulary the old
 * sign-off tracks each used for the same idea (`confirmed`/`unconfirmable`/`rework`/`pass`/`green`).
 *
 * USAGE:
 * unitMarkContract.parse('cant-meet');
 * // Returns 'cant-meet' as UnitMark
 */

import { z } from 'zod';

export const unitMarkContract = z.enum(['met', 'cant-meet', 'unmet']);

export type UnitMark = z.infer<typeof unitMarkContract>;
