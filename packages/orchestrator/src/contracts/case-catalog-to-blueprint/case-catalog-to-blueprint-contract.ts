/**
 * PURPOSE: Defines the data `caseCatalogToBlueprintTransformer` returns
 *
 * USAGE:
 * caseCatalogToBlueprintContract.parse(value);
 * // Returns validated CaseCatalogToBlueprint
 */
import { z } from '#gateway/npm/zod';
import { questBlueprintContract } from '../quest-blueprint/quest-blueprint-contract';
import { workItemContract } from '@dungeonmaster/shared/contracts';

export const caseCatalogToBlueprintContract = z
  .object({ blueprint: questBlueprintContract, workItems: z.array(workItemContract) })
  .brand<'CaseCatalogToBlueprint'>();

export type CaseCatalogToBlueprint = z.infer<typeof caseCatalogToBlueprintContract>;
