/**
 * PURPOSE: Defines the data `contractUsesScanLayerTransformer` returns
 *
 * USAGE:
 * contractUsesScanLayerContract.parse(value);
 * // Returns validated ContractUsesScanLayer
 */
import { z } from '#gateway/npm/zod';
import { contractParseSiteContract } from '../contract-parse-site/contract-parse-site-contract';

export const contractUsesScanLayerContract = z
  .object({
    parseSites: z.array(
      z
        .object({
          targetFile: z.string().brand<'ContractUsesScanLayerParseSitesTargetFile'>(),
          site: contractParseSiteContract,
        })
        .brand<'ContractUsesScanLayerParseSites'>(),
    ),
    valueTargets: z.array(z.string().brand<'ContractUsesScanLayerValueTargets'>()),
  })
  .brand<'ContractUsesScanLayer'>();

export type ContractUsesScanLayer = z.infer<typeof contractUsesScanLayerContract>;
