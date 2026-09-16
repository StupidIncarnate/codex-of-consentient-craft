/**
 * PURPOSE: Proves the barrel `@dungeonmaster/siegelense` dynamically imports agrees, by NAME and by
 * SHAPE, with `recipesConventionStatics` — the one file both sides read, since siegelense may
 * import neither this package nor `@dungeonmaster/hydration`. Nothing in the type system checks
 * this any other way: a rename on either side compiles fine on both sides and fails only at run
 * time, in a consumer's repo. The shape checked below mirrors
 * `packages/siegelense/src/contracts/recipe-listing-entry/` and `recipes-listing/`, read but not
 * imported, for the same "may import neither" reason.
 *
 * USAGE: no exports — a Jest suite.
 */
import { z } from 'zod';

import { recipesConventionStatics } from '@dungeonmaster/shared/statics';

import * as siegelenseRecipesIndex from '../index';

const ingredientNameShape = z.string().min(1).brand<'IngredientName'>();
const makesCountShape = z.number().int().positive().brand<'MakesCount'>();

const recipesListingShape = z.array(
  z
    .object({
      recipeName: z.string().min(1).brand<'RecipeName'>(),
      description: z.string().min(1).brand<'RecipeDescription'>(),
      inputKeys: z.array(z.string().min(1).brand<'RecipeInputKey'>()),
      runs: z.discriminatedUnion('serverless', [
        z.object({ serverless: z.literal(true) }),
        z.object({ serverless: z.literal(false), needsServerFor: ingredientNameShape }),
      ]),
      makes: z.array(
        z.object({
          ingredient: ingredientNameShape,
          count: z.union([makesCountShape, z.literal('varies')]),
        }),
      ),
    })
    .strict(),
);

describe('the exports @dungeonmaster/siegelense reads off this package', () => {
  it('VALID: {} => the module carries exactly the convention names this package currently implements', () => {
    expect(Object.keys(siegelenseRecipesIndex).sort()).toStrictEqual(
      [
        recipesConventionStatics.exports.manifest,
        recipesConventionStatics.exports.listingBuild,
      ].sort(),
    );
  });

  it('VALID: {} => the export named by exports.listingBuild takes zero arguments', () => {
    const listingExport = siegelenseRecipesIndex[recipesConventionStatics.exports.listingBuild];
    const declaredArity = listingExport.length;

    expect(declaredArity).toStrictEqual(0);
  });

  it('VALID: {} => calling it returns the real listing, matching the shape siegelense parses', () => {
    const listingExport = siegelenseRecipesIndex[recipesConventionStatics.exports.listingBuild];

    const listing = listingExport();

    expect(listing).toStrictEqual([
      {
        recipeName: 'guild-mid-execution',
        description:
          'one guild holding three quests, the first running with its riftcarver item dropped',
        inputKeys: [],
        runs: { serverless: true },
        makes: [
          { ingredient: 'guild', count: 1 },
          { ingredient: 'quest', count: 3 },
          { ingredient: 'operation', count: 'varies' },
        ],
      },
      {
        recipeName: 'quest-advances-one-step',
        description:
          'one quest under an existing guild, its ledger already one operation along — the first item complete and the second running',
        inputKeys: ['guildId'],
        runs: { serverless: true },
        makes: [{ ingredient: 'quest', count: 1 }],
      },
      {
        recipeName: 'session-with-nested-chain',
        description: 'one session under an existing guild, holding a nested sub-agent chain',
        inputKeys: ['guildPath'],
        runs: { serverless: true },
        makes: [{ ingredient: 'session', count: 1 }],
      },
    ]);
    expect(recipesListingShape.parse(listing)).toStrictEqual(listing);
  });

  it('VALID: {} => recipesManifest names and describes the same recipes the listing broker does', () => {
    const manifestExport = siegelenseRecipesIndex[recipesConventionStatics.exports.manifest];

    expect(
      manifestExport.map((entry) => ({
        recipeName: entry.recipeName,
        description: entry.description,
      })),
    ).toStrictEqual([
      {
        recipeName: 'guild-mid-execution',
        description:
          'one guild holding three quests, the first running with its riftcarver item dropped',
      },
      {
        recipeName: 'quest-advances-one-step',
        description:
          'one quest under an existing guild, its ledger already one operation along — the first item complete and the second running',
      },
      {
        recipeName: 'session-with-nested-chain',
        description: 'one session under an existing guild, holding a nested sub-agent chain',
      },
    ]);
  });
});
