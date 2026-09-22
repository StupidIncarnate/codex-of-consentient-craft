/**
 * The cross-seam proof DEF-16/DEF-17 named as missing: every OTHER test on this file mocks the
 * recipes boundary with a shape the real producer never emits (a flat `Record<string, string>`),
 * so they all passed while `siegelense start --seed <anyRecipe>` failed for every real recipe.
 * `seedHomeHarness` drives the REAL, compiled `@dungeonmaster/hydration-recipes` package against a
 * real temp home and re-validates its raw output through `seedResultContract` (via `SeedResultStub`
 * — see the harness's own header for why this test file cannot call the contract directly), proving
 * the shape is the full saved row per `saveRecordAs` name (a Guild, a Quest, …), never a flattened
 * id.
 */

import { RecipeNameStub } from '../../../contracts/recipe-name/recipe-name.stub';
import { seedHomeHarness } from '../../../../test/harnesses/seed-home/seed-home.harness';

describe('the recipes seam — a real recipe run against seedResultContract', () => {
  const seedHome = seedHomeHarness();

  it('VALID: {guild-empty, a real temp home} => the real producer output parses, carrying the minted guild id and its derived name/urlSlug', async () => {
    const result = (await seedHome.runRecipe({
      recipeName: RecipeNameStub({ value: 'guild-empty' }),
    })) as Record<PropertyKey, unknown>;
    const guild = result.guild as Record<PropertyKey, unknown>;

    expect({ name: guild.name, urlSlug: guild.urlSlug }).toStrictEqual({
      name: 'Guild 1',
      urlSlug: 'guild-1',
    });
    expect(guild.id).toMatch(/^[0-9a-f-]{36}$/u);
  });

  it('ERROR: {guild-with-three-quests, a real temp home} => a write-only target cannot walk the quest to "in_progress", so the run throws HydrationTransitionRefusedError naming the gate', async () => {
    await expect(
      seedHome.runRecipe({ recipeName: RecipeNameStub({ value: 'guild-with-three-quests' }) }),
    ).rejects.toThrow(
      new Error(
        'recipe "guild-with-three-quests": ingredient "quest" cannot go to "in_progress" from "approved": questReachRouteBroker: a write-only target cannot walk a quest to "in_progress" — seeding the operations relay needs POST /api/quests/:questId/start, which has no in-process equivalent exported from @dungeonmaster/orchestrator. Use an api target instead.',
      ),
    );
  });
});
