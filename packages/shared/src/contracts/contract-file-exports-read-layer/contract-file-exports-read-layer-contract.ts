/**
 * PURPOSE: Defines the data `contractFileExportsReadLayerTransformer` returns
 *
 * USAGE:
 * contractFileExportsReadLayerContract.parse(value);
 * // Returns validated ContractFileExportsReadLayer
 */
import { z } from '#gateway/npm/zod';

export const contractFileExportsReadLayerContract = z
  .object({
    exportedConstNames: z.array(
      z.string().brand<'ContractFileExportsReadLayerExportedConstNames'>(),
    ),
    typeExports: z.array(
      z
        .object({
          typeName: z.string().brand<'ContractFileExportsReadLayerTypeExportsTypeName'>(),
          isSchemaInferred: z.boolean(),
          isExempt: z.boolean(),
        })
        .brand<'ContractFileExportsReadLayerTypeExports'>(),
    ),
  })
  .brand<'ContractFileExportsReadLayer'>();

export type ContractFileExportsReadLayer = z.infer<typeof contractFileExportsReadLayerContract>;
