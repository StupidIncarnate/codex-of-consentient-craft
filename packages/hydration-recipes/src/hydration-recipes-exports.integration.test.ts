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

import * as hydrationRecipesIndex from '../index';

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
  it('VALID: {} => the module carries the convention exports plus StartHydrationRecipes and framework brokers', () => {
    expect(Object.keys(hydrationRecipesIndex).sort()).toStrictEqual(
      [
        ...Object.values(recipesConventionStatics.exports),
        'StartHydrationRecipes',
        'dmRegistryBroker',
        'recipesHydrationCreateBroker',
        'questIngredientBroker',
      ].sort(),
    );
  });

  it('VALID: {} => the export named by exports.listing takes zero arguments', () => {
    const listingExport = hydrationRecipesIndex[recipesConventionStatics.exports.listing];
    const declaredArity = listingExport.length;

    expect(declaredArity).toStrictEqual(0);
  });

  it('VALID: {} => the export named by exports.seed takes exactly one argument', () => {
    const seedRunExport = hydrationRecipesIndex[recipesConventionStatics.exports.seed];
    const declaredArity = seedRunExport.length;

    expect(declaredArity).toStrictEqual(1);
  });

  it('VALID: {} => calling it returns the real listing, matching the shape siegelense parses', () => {
    const listingExport = hydrationRecipesIndex[recipesConventionStatics.exports.listing];

    const listing = listingExport();

    expect(listing).toStrictEqual([
      {
        recipeName: 'guild-empty',
        description: 'one empty guild with no quests or sessions, ready for initial configuration',
        inputKeys: [],
        runs: { serverless: true },
        makes: [{ ingredient: 'guild', count: 1 }],
      },
      {
        recipeName: 'guild-with-three-quests',
        description:
          'one guild holding three quests: one created, one in_progress, and one complete',
        inputKeys: [],
        runs: { serverless: true },
        makes: [
          { ingredient: 'guild', count: 1 },
          { ingredient: 'quest', count: 'varies' },
        ],
      },
      {
        recipeName: 'guild-mid-execution',
        description:
          'one guild holding three quests — the first running with its riftcarver item dropped, ' +
          'the second and third both freshly created and told apart only by their seeded title ' +
          'and request text ("Quest 2"/"Quest 3")',
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
        makes: [
          { ingredient: 'quest', count: 1 },
          { ingredient: 'operation', count: 2 },
        ],
      },
      {
        recipeName: 'quest-completed',
        description:
          'one guild holding one completed quest with all workflow operations and work items finished',
        inputKeys: [],
        runs: { serverless: true },
        makes: [
          { ingredient: 'guild', count: 1 },
          { ingredient: 'quest', count: 1 },
          { ingredient: 'operation', count: 2 },
        ],
      },
      {
        recipeName: 'session-single-turn',
        description:
          'one session under an existing guild, holding a single turn prompt and response',
        inputKeys: ['guildPath'],
        runs: { serverless: true },
        makes: [{ ingredient: 'session', count: 1 }],
      },
      {
        recipeName: 'session-with-nested-chain',
        description:
          'one session under an existing guild, holding a nested sub-agent chain two levels ' +
          'deep — a top agent with one sub-agent nested under it',
        inputKeys: ['guildPath'],
        runs: { serverless: true },
        makes: [{ ingredient: 'session', count: 1 }],
      },
      {
        recipeName: 'guild-active-suite',
        description:
          'one active guild holding two quests (one in progress, one complete) and a session with subagent chain',
        inputKeys: [],
        runs: { serverless: true },
        makes: [
          { ingredient: 'guild', count: 1 },
          { ingredient: 'quest', count: 2 },
          { ingredient: 'session', count: 1 },
          { ingredient: 'subagent', count: 1 },
        ],
      },
      {
        recipeName: 'session-with-nested-subagent',
        description:
          'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
        inputKeys: ['guild'],
        runs: { serverless: false, needsServerFor: 'guild' },
        makes: [
          { ingredient: 'session', count: 1 },
          { ingredient: 'subagent', count: 2 },
        ],
      },
    ]);
    expect(recipesListingShape.parse(listing)).toStrictEqual(listing);
  });

  it('VALID: {} => recipesManifest names and describes the same recipes the listing broker does', () => {
    const manifestExport = hydrationRecipesIndex[recipesConventionStatics.exports.manifest];

    expect(
      manifestExport.map((entry) => ({
        recipeName: entry.recipeName,
        description: entry.description,
      })),
    ).toStrictEqual([
      {
        recipeName: 'guild-empty',
        description: 'one empty guild with no quests or sessions, ready for initial configuration',
      },
      {
        recipeName: 'guild-with-three-quests',
        description:
          'one guild holding three quests: one created, one in_progress, and one complete',
      },
      {
        recipeName: 'guild-mid-execution',
        description:
          'one guild holding three quests — the first running with its riftcarver item dropped, ' +
          'the second and third both freshly created and told apart only by their seeded title ' +
          'and request text ("Quest 2"/"Quest 3")',
      },
      {
        recipeName: 'quest-advances-one-step',
        description:
          'one quest under an existing guild, its ledger already one operation along — the first item complete and the second running',
      },
      {
        recipeName: 'quest-completed',
        description:
          'one guild holding one completed quest with all workflow operations and work items finished',
      },
      {
        recipeName: 'session-single-turn',
        description:
          'one session under an existing guild, holding a single turn prompt and response',
      },
      {
        recipeName: 'session-with-nested-chain',
        description:
          'one session under an existing guild, holding a nested sub-agent chain two levels ' +
          'deep — a top agent with one sub-agent nested under it',
      },
      {
        recipeName: 'guild-active-suite',
        description:
          'one active guild holding two quests (one in progress, one complete) and a session with subagent chain',
      },
      {
        recipeName: 'session-with-nested-subagent',
        description:
          'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
      },
    ]);
  });
});

describe('the StartHydrationRecipes startup export', () => {
  it('VALID: {} => exposes listing and seed methods with expected arities', () => {
    expect({
      listingArity: hydrationRecipesIndex.StartHydrationRecipes.listing.length,
      seedArity: hydrationRecipesIndex.StartHydrationRecipes.seed.length,
    }).toStrictEqual({
      listingArity: 0,
      seedArity: 1,
    });
  });

  it('VALID: {} => StartHydrationRecipes.listing() returns recipes listing matching shape', () => {
    const listing = hydrationRecipesIndex.StartHydrationRecipes.listing();

    expect(listing.map((entry) => entry.recipeName)).toStrictEqual([
      'guild-empty',
      'guild-with-three-quests',
      'guild-mid-execution',
      'quest-advances-one-step',
      'quest-completed',
      'session-single-turn',
      'session-with-nested-chain',
      'guild-active-suite',
      'session-with-nested-subagent',
    ]);
    expect(recipesListingShape.parse(listing)).toStrictEqual(listing);
  });
});
