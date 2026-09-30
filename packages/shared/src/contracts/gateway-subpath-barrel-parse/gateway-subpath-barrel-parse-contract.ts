/**
 * PURPOSE: Defines the data `gatewaySubpathBarrelParseTransformer` returns
 *
 * USAGE:
 * gatewaySubpathBarrelParseContract.parse(value);
 * // Returns validated GatewaySubpathBarrelParse
 */
import { z } from '#gateway/npm/zod';

export const gatewaySubpathBarrelParseContract = z
  .object({
    realModule: z.string().brand<'GatewaySubpathBarrelParseRealModule'>().optional(),
    wrapperNames: z.array(z.string().brand<'GatewaySubpathBarrelParseWrapperNames'>()),
  })
  .brand<'GatewaySubpathBarrelParse'>();

export type GatewaySubpathBarrelParse = z.infer<typeof gatewaySubpathBarrelParseContract>;
