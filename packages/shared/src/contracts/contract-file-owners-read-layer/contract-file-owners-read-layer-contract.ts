/**
 * PURPOSE: Defines the data `contractFileOwnersReadLayerTransformer` returns
 *
 * USAGE:
 * contractFileOwnersReadLayerContract.parse(value);
 * // Returns validated ContractFileOwnersReadLayer
 */
import { z } from '#gateway/npm/zod';
import { ownerIndexOwnerContract } from '../owner-index-owner/owner-index-owner-contract';
import { ownerIndexStandaloneBrandContract } from '../owner-index-standalone-brand/owner-index-standalone-brand-contract';
import { ownerIndexEnumContract } from '../owner-index-enum/owner-index-enum-contract';

export const contractFileOwnersReadLayerContract = z
  .object({
    owners: z.array(ownerIndexOwnerContract),
    standaloneBrands: z.array(ownerIndexStandaloneBrandContract),
    enums: z.array(ownerIndexEnumContract),
  })
  .brand<'ContractFileOwnersReadLayer'>();

export type ContractFileOwnersReadLayer = z.infer<typeof contractFileOwnersReadLayerContract>;
