/**
 * PURPOSE: Builds a valid `RecipeCatalogEntry` for a test that needs one. Defaults to
 * valid dummy metadata, a serverless probe listing with no makes or input keys, and a no-op
 * execution that returns a valid HydrationRunResult.
 *
 * USAGE:
 * RecipeCatalogEntryStub({ recipeName: 'guild-with-three-quests' });
 * // Returns a RecipeCatalogEntry
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { HydrationRunResultStub } from '@dungeonmaster/hydration/contracts/hydration-run-result/hydration-run-result.stub';
import { PlanRunsResultStub } from '@dungeonmaster/hydration/contracts/plan-runs-result/plan-runs-result.stub';

import { recipeCatalogEntryContract } from './recipe-catalog-entry-contract';
import type { RecipeCatalogEntry } from './recipe-catalog-entry-contract';

export const RecipeCatalogEntryStub = ({
  ...props
}: StubArgument<RecipeCatalogEntry> = {}): RecipeCatalogEntry => {
  const { probeListing, execute, ...dataProps } = props;

  return {
    ...recipeCatalogEntryContract.parse({
      recipeName: 'guild-with-three-quests',
      description: 'one guild holding three quests',
      ...dataProps,
    }),
    probeListing:
      probeListing ??
      (() => ({
        runs: PlanRunsResultStub(),
        makes: [],
        inputKeys: [],
      })),
    execute: execute ?? (async () => Promise.resolve(HydrationRunResultStub())),
  };
};
