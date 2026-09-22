/**
 * PURPOSE: Runs a REAL recipe from the compiled `@dungeonmaster/hydration-recipes` package
 * against a real, empty `DUNGEONMASTER_HOME` directory — the exact two calls `recipeSeedRunBroker`
 * itself makes (`recipesLocateBroker`, then `runtimeDynamicImportAdapter`), but omitting `baseUrl`
 * so `routeSelectTransformer` (in `@dungeonmaster/hydration`) picks the `write` route rather than
 * `api`: `guild` and `quest` both declare an `api` route, and that transformer prefers it the
 * instant a target carries ANY `baseUrl` string, which would force a real HTTP call this harness
 * has no server to answer. The shape `dmRegistryBroker.run` hands back is identical either way —
 * only HOW each op reaches disk differs, never what `saveRecordAs` returns — so this still proves
 * exactly what `seedResultContract` must accept. Re-validates the raw producer output through
 * `SeedResultStub` (never the local `-contract.ts` file directly, which harness files may not
 * import) the same way `file-target.harness.ts` re-validates a quest file's raw JSON through
 * `QuestStub`.
 *
 * Seeds `config.json` before every run — `guildConfigReadBroker`'s ENOENT fallback never fires
 * without one, and the route fails outright on the very first guild otherwise (confirmed by reading
 * `packages/hydration-recipes/test/harnesses/file-target/file-target.harness.ts`'s own header,
 * which this package cannot import — it lives under another package's `test/`, not its public
 * surface). `process.env.DUNGEONMASTER_HOME` is deliberately left untouched here —
 * `recipesSeedRunBroker` (the real, dynamically-imported producer `runRecipe` drives) already sets
 * and restores it itself around the run.
 *
 * Requires `packages/hydration-recipes/dist/index.js` to exist and be current —
 * `packages/hydration-recipes/CLAUDE.md`'s "Build before a listing is honest" applies here too;
 * `recipesLocateBroker` throws `RecipesBuildMissingError` naming the missing path when it does not.
 *
 * USAGE:
 * describe('...', () => {
 *   const seedHome = seedHomeHarness();
 *   it('VALID: {} => runs a real recipe against it', async () => {
 *     const result = await seedHome.runRecipe({ recipeName: RecipeNameStub({ value: 'guild-empty' }) });
 *   });
 * });
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics, recipesConventionStatics } from '@dungeonmaster/shared/statics';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import type { RecipeNameStub } from '../../../src/contracts/recipe-name/recipe-name.stub';
import { SeedResultStub } from '../../../src/contracts/seed-result/seed-result.stub';
import { recipesLocateBroker } from '../../../src/brokers/recipes/locate/recipes-locate-broker';

type RecipeName = ReturnType<typeof RecipeNameStub>;
type SeedResult = ReturnType<typeof SeedResultStub>;

const EMPTY_GUILD_CONFIG = { guilds: [] };

export const seedHomeHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  homePath: () => AbsoluteFilePath;
  runRecipe: (params: { recipeName: RecipeName }) => Promise<SeedResult>;
} => {
  let testbed: ReturnType<typeof installTestbedCreateBroker> | undefined;

  const homePath = (): AbsoluteFilePath => {
    if (testbed === undefined) {
      throw new Error('seedHomeHarness: called outside beforeEach/afterEach');
    }
    return absoluteFilePathContract.parse(testbed.guildPath);
  };

  return {
    beforeEach: (): void => {
      testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'siegelense-seed-seam' }),
      });
      writeFileSync(
        join(testbed.guildPath, dungeonmasterHomeStatics.paths.configFile),
        JSON.stringify(EMPTY_GUILD_CONFIG),
      );
    },
    afterEach: (): void => {
      testbed?.cleanup();
      testbed = undefined;
    },
    homePath,
    runRecipe: async ({ recipeName }: { recipeName: RecipeName }): Promise<SeedResult> => {
      const entryPath = await recipesLocateBroker();
      const recipesModule = await runtimeDynamicImportAdapter({ path: entryPath });
      const seedRun = (recipesModule as Record<PropertyKey, unknown>)[
        recipesConventionStatics.exports.seed
      ] as (params: unknown) => Promise<unknown>;

      const raw = await seedRun({ recipeName, params: {}, home: homePath() });
      return SeedResultStub(raw as StubArgument<SeedResult>);
    },
  };
};
