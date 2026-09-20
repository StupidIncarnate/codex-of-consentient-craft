/**
 * PURPOSE: The `guild-with-three-quests` recipe, executable — produces one guild holding three
 * quests, one in_progress, at fidelity: production. Reach for this over other recipes when
 * testing full HTTP orchestration against the lane API.
 *
 * USAGE:
 * await recipesGuildWithThreeQuestsBroker({ context });
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

export const recipesGuildWithThreeQuestsBroker = async ({
  context,
}: {
  context: RecipeContext;
}): Promise<RecipeResult> => {
  const guildPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [context.homePath, seedFixtureStatics.guild.pathSegment] }),
  );
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
