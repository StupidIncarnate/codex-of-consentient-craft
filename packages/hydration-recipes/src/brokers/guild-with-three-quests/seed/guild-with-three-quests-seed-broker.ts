/**
 * PURPOSE: The `guild-with-three-quests` recipe, executable — `produces: one guild holding three
 * quests, one in_progress`, at `fidelity: production`. Every piece of state it makes is made by
 * calling the app's OWN writer over the lane's real API: `POST /api/guilds`, `POST /api/quests`
 * three times, and then one `PATCH /api/quests/:id` per edge of `questStatusTransitionsStatics`
 * from `created` to `in_progress`. Nothing here writes a file the server would have written —
 * "built by calling the real code path, so the server does what it really does"
 * (siegelense-recipes.md line 433) is the whole claim `production` makes, and a recipe that wrote
 * a quest.json itself would be a fixture that lies.
 *
 * The returned ids are the ones the RESPONSES carried, never the ones this broker sent: it sends
 * no id at all — the server mints the guild's uuid and slug and each quest's id — so `guildId`,
 * `guildSlug` and `questId` can only be real.
 *
 * `POST /api/quests/:id/start` is deliberately NOT used, even though it is the route a person
 * clicks. It also SPAWNS the orchestration loop, so the seeded state would keep moving after the
 * recipe returned — and "where a value varies for a reason nothing in the walk caused, the
 * difference reads as a defect" (siegelense-recipes.md line 356). `approved -> in_progress` is a
 * legal status edge without it, so the PATCH walk reaches the same status and stops there.
 *
 * The quest left `in_progress` is the MIDDLE one (`seedFixtureStatics.quest.inProgressIndex`), so
 * "the right one" and "the first one" are different values and an off-by-index bug in whatever the
 * walk asserts cannot pass (siegelense-recipes.md line 454).
 *
 * USAGE:
 * await guildWithThreeQuestsSeedBroker({ context });
 * // Returns { guildId, guildSlug, questId } — the ids the server minted
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  addQuestResultContract,
  contentTextContract,
  filePathContract,
  guildContract,
  modifyQuestResultContract,
} from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { fetchJsonAdapter } from '../../../adapters/fetch/json/fetch-json-adapter';
import { recipeResultContract } from '../../../contracts/recipe-result/recipe-result-contract';
import type { RecipeResult } from '../../../contracts/recipe-result/recipe-result-contract';
import type { RecipeContext } from '../../../contracts/recipe-context/recipe-context-contract';
import { recipeHttpStatics } from '../../../statics/recipe-http/recipe-http-statics';
import { seedFixtureStatics } from '../../../statics/seed-fixture/seed-fixture-statics';

export const guildWithThreeQuestsSeedBroker = async ({
  context,
}: {
  context: RecipeContext;
}): Promise<RecipeResult> => {
  const guildPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [context.homePath, seedFixtureStatics.guild.pathSegment] }),
  );
  // A guild points at a directory. The app never checks that it exists, but the Claude transcript
  // encoding and the session view both resolve through it, so a composed `direct` recipe would
  // otherwise write under a path nothing created.
  await fsMkdirAdapter({ filepath: filePathContract.parse(guildPath) });

  const guildsUrl = contentTextContract.parse(
    `${context.apiBaseUrl}${recipeHttpStatics.routes.guilds}`,
  );
  const guild = guildContract.parse(
    await fetchJsonAdapter({
      url: guildsUrl,
      method: contentTextContract.parse(recipeHttpStatics.methods.post),
      body: { name: seedFixtureStatics.guild.name, path: guildPath },
    }),
  );

  const { urlSlug } = guild;
  if (urlSlug === undefined) {
    throw new Error(
      `guild-with-three-quests: POST ${recipeHttpStatics.routes.guilds} answered a guild with no urlSlug, so the recipe cannot return the route segment every seeded URL is built from. Guild id: ${guild.id}`,
    );
  }

  const questsUrl = contentTextContract.parse(
    `${context.apiBaseUrl}${recipeHttpStatics.routes.quests}`,
  );

  // Sequential, not Promise.all: each POST is a read-modify-write of the guild's own quest index,
  // and `guildAddBroker`'s own header records that concurrent writes on that path corrupt it.
  const questIds: ContentText[] = [];
  await seedFixtureStatics.quest.titles.reduce(async (previous, title) => {
    await previous;

    const added = addQuestResultContract.parse(
      await fetchJsonAdapter({
        url: questsUrl,
        method: contentTextContract.parse(recipeHttpStatics.methods.post),
        body: {
          guildId: guild.id,
          title,
          userRequest: seedFixtureStatics.quest.userRequest,
        },
      }),
    );

    if (added.questId === undefined) {
      throw new Error(
        `guild-with-three-quests: POST ${recipeHttpStatics.routes.quests} answered no questId for "${title}": ${JSON.stringify(added)}`,
      );
    }

    questIds.push(contentTextContract.parse(added.questId));
  }, Promise.resolve());

  const inProgressQuestId = questIds[seedFixtureStatics.quest.inProgressIndex];
  if (inProgressQuestId === undefined) {
    throw new Error(
      `guild-with-three-quests: no quest at index ${String(seedFixtureStatics.quest.inProgressIndex)} — ${String(questIds.length)} were created`,
    );
  }

  const questUrl = contentTextContract.parse(
    `${context.apiBaseUrl}${recipeHttpStatics.routes.quests}/${inProgressQuestId}`,
  );

  // One PATCH per status edge, in order. `questStatusInputAllowlistStatics` decides which fields
  // each status will accept, so the flow blueprint rides exactly one of them — the transition INTO
  // `flowsAtStatus`, issued while the quest sits at the first status whose allowlist admits
  // `flows`. `questGateContentRequirementsStatics` then finds them non-empty two edges later.
  await seedFixtureStatics.quest.statusWalk.reduce(async (previous, status) => {
    await previous;

    const carriesFlows = status === seedFixtureStatics.quest.flowsAtStatus;
    const modified = modifyQuestResultContract.parse(
      await fetchJsonAdapter({
        url: questUrl,
        method: contentTextContract.parse(recipeHttpStatics.methods.patch),
        body: {
          questId: inProgressQuestId,
          status,
          ...(carriesFlows
            ? {
                flows: seedFixtureStatics.quest.flows,
                packagesAffected: seedFixtureStatics.quest.packagesAffected,
              }
            : {}),
        },
      }),
    );

    if (!modified.success) {
      throw new Error(
        `guild-with-three-quests: PATCH to status "${status}" on quest ${inProgressQuestId} was refused: ${modified.error ?? 'no reason given'}`,
      );
    }
  }, Promise.resolve());

  return recipeResultContract.parse({
    guildId: guild.id,
    guildSlug: urlSlug,
    questId: inProgressQuestId,
  });
};
