/**
 * PURPOSE: Defines the data `gatewayBarrelExportedNamesTransformer` returns
 *
 * USAGE:
 * gatewayBarrelExportedNamesContract.parse(value);
 * // Returns validated GatewayBarrelExportedNames
 */
import { z } from '#gateway/npm/zod';

export const gatewayBarrelExportedNamesContract = z
  .object({
    directNames: z.array(z.string().brand<'GatewayBarrelExportedNamesDirectNames'>()),
    reexportTargets: z.array(z.string().brand<'GatewayBarrelExportedNamesReexportTargets'>()),
  })
  .brand<'GatewayBarrelExportedNames'>();

export type GatewayBarrelExportedNames = z.infer<typeof gatewayBarrelExportedNamesContract>;
