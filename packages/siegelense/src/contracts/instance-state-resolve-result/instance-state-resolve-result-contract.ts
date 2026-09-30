/**
 * PURPOSE: Defines the data `instanceStateResolveBroker` returns
 *
 * USAGE:
 * instanceStateResolveResultContract.parse(value);
 * // Returns validated InstanceStateResolveResult
 */
import { z } from '#gateway/npm/zod';
import { instanceStateContract } from '../instance-state/instance-state-contract';
import { registryEntryContract } from '../registry-entry/registry-entry-contract';

export const instanceStateResolveResultContract = z
  .object({ state: instanceStateContract, entry: registryEntryContract.nullable() })
  .brand<'InstanceStateResolveResult'>();

export type InstanceStateResolveResult = z.infer<typeof instanceStateResolveResultContract>;
