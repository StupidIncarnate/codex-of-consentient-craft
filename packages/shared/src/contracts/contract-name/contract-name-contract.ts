/**
 * PURPOSE: Name of a quest-level contract entry. Used to reference contracts from step inputContracts/outputContracts
 *
 * USAGE:
 * const name: ContractName = contractNameContract.parse('LoginCredentials');
 * // Returns a branded ContractName string type
 */
import { z } from 'zod';

export const contractNameContract = z
  .string()
  .min(1)
  .brand<'ContractName'>()
  .describe(
    'Name of a quest-level contract entry. Used to reference contracts from step inputContracts/outputContracts',
  );

export type ContractName = z.infer<typeof contractNameContract>;
