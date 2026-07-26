/**
 * PURPOSE: Scores how specifically a staged argument matcher describes a call, so the most specific staging wins
 *
 * USAGE:
 * matchSpecificityContract.parse(3);
 * // Returns validated MatchSpecificity branded type — one point per leaf value compared
 */

import { z } from 'zod';

export const matchSpecificityContract = z.number().int().min(0).brand<'MatchSpecificity'>();

export type MatchSpecificity = z.infer<typeof matchSpecificityContract>;
