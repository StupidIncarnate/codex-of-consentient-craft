// PURPOSE: Proxy for guild-with-three-quests-seed-broker — stages the lane API's answers at the
// fetch boundary and the mkdir at the fs boundary, so the recipe's own HTTP sequencing runs real.
// USAGE: const proxy = guildWithThreeQuestsSeedBrokerProxy(); proxy.laneAnswers({ apiBaseUrl, guild, questIds });

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fetchJsonAdapterProxy } from '../../../adapters/fetch/json/fetch-json-adapter.proxy';
import { recipeHttpStatics } from '../../../statics/recipe-http/recipe-http-statics';
import { seedFixtureStatics } from '../../../statics/seed-fixture/seed-fixture-statics';

export const guildWithThreeQuestsSeedBrokerProxy = (): {
  laneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: unknown;
    questIds: readonly ContentText[];
  }) => void;
  guildAnswers: (params: { apiBaseUrl: ContentText; guild: unknown }) => void;
  patchRefuses: (params: {
    apiBaseUrl: ContentText;
    questId: ContentText;
    error: ContentText;
  }) => void;
  requestBodies: () => readonly unknown[];
  requestLines: () => readonly ContentText[];
} => {
  const fetchProxy = fetchJsonAdapterProxy();
  // Both take their own defaults: mkdir succeeds for any unaddressed path, and pathJoin passes
  // through to the real `path.join`, so the guild path the recipe builds is a genuine one.
  fsMkdirAdapterProxy();
  pathJoinAdapterProxy();

  return {
    laneAnswers: ({
      apiBaseUrl,
      guild,
      questIds,
    }: {
      apiBaseUrl: ContentText;
      guild: unknown;
      questIds: readonly ContentText[];
    }): void => {
      fetchProxy.answers({
        url: `${apiBaseUrl}${recipeHttpStatics.routes.guilds}`,
        method: recipeHttpStatics.methods.post,
        body: guild,
      });

      // Three POSTs to the SAME url must answer three DIFFERENT quest ids, so each is a one-shot
      // staged in order rather than a shared catch-all handing the same id back three times.
      questIds.forEach((questId) => {
        fetchProxy.answersOnce({
          url: `${apiBaseUrl}${recipeHttpStatics.routes.quests}`,
          method: recipeHttpStatics.methods.post,
          body: { success: true, questId },
        });
      });

      const inProgressQuestId = questIds[seedFixtureStatics.quest.inProgressIndex];
      fetchProxy.answers({
        url: `${apiBaseUrl}${recipeHttpStatics.routes.quests}/${String(inProgressQuestId)}`,
        method: recipeHttpStatics.methods.patch,
        body: { success: true },
      });
    },

    guildAnswers: ({ apiBaseUrl, guild }: { apiBaseUrl: ContentText; guild: unknown }): void => {
      fetchProxy.answers({
        url: `${apiBaseUrl}${recipeHttpStatics.routes.guilds}`,
        method: recipeHttpStatics.methods.post,
        body: guild,
      });
    },

    patchRefuses: ({
      apiBaseUrl,
      questId,
      error,
    }: {
      apiBaseUrl: ContentText;
      questId: ContentText;
      error: ContentText;
    }): void => {
      fetchProxy.answers({
        url: `${apiBaseUrl}${recipeHttpStatics.routes.quests}/${questId}`,
        method: recipeHttpStatics.methods.patch,
        body: { success: false, error },
      });
    },

    // Every request body the recipe sent, in order, already JSON-parsed — what a test asserts the
    // recipe actually asked the app to do.
    requestBodies: (): readonly unknown[] =>
      fetchProxy.allRequests().map((call) => {
        const [, init] = call;
        const body = init !== null && typeof init === 'object' && 'body' in init ? init.body : null;
        return typeof body === 'string' ? JSON.parse(body) : null;
      }),

    // `<METHOD> <url>` per request, in order — the sequence itself, without the bodies.
    requestLines: (): readonly ContentText[] =>
      fetchProxy.allRequests().map((call) => {
        const [url, init] = call;
        const method =
          init !== null && typeof init === 'object' && 'method' in init ? String(init.method) : '?';
        return contentTextContract.parse(`${method} ${String(url)}`);
      }),
  };
};
