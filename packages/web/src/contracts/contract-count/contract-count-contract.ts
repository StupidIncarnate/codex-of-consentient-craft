/**
 * PURPOSE: Defines a branded number type for counting the contracts anchored to a flow node
 *
 * USAGE:
 * contractCountContract.parse(2);
 * // Returns: ContractCount branded number
 */

import { z } from 'zod';

export const contractCountContract = z.number().int().min(0).brand<'ContractCount'>();

export type ContractCount = z.infer<typeof contractCountContract>;
