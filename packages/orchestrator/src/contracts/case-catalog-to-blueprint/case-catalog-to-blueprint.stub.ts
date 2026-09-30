/**
 * PURPOSE: Builds a valid CaseCatalogToBlueprint for tests
 *
 * USAGE:
 * CaseCatalogToBlueprintStub();
 * // Returns a valid CaseCatalogToBlueprint
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestBlueprintStub } from '../quest-blueprint/quest-blueprint.stub';

import { caseCatalogToBlueprintContract } from './case-catalog-to-blueprint-contract';
import type { CaseCatalogToBlueprint } from './case-catalog-to-blueprint-contract';

export const CaseCatalogToBlueprintStub = ({
  ...props
}: StubArgument<CaseCatalogToBlueprint> = {}): CaseCatalogToBlueprint =>
  caseCatalogToBlueprintContract.parse({
    blueprint: QuestBlueprintStub(),
    workItems: [],
    ...props,
  });
