/**
 * PURPOSE: Defines a branded number type for counting observables on a quest
 *
 * USAGE:
 * observableCountContract.parse(3);
 * // Returns: ObservableCount branded number
 */

import { z } from 'zod';

export const observableCountContract = z.number().int().min(0).brand<'ObservableCount'>();

export type ObservableCount = z.infer<typeof observableCountContract>;
