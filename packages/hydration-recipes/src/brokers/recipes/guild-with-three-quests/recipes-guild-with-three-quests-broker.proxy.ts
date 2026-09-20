import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fetchJsonAdapterProxy } from '../../../adapters/fetch/json/fetch-json-adapter.proxy';
import { recipeHttpStatics } from '../../../statics/recipe-http/recipe-http-statics';
import { seedFixtureStatics } from '../../../statics/seed-fixture/seed-fixture-statics';

export const recipesGuildWithThreeQuestsBrokerProxy = (): {
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

    requestBodies: (): readonly unknown[] =>
      fetchProxy.allRequests().map((call) => {
        const [, init] = call;
        const body = init !== null && typeof init === 'object' && 'body' in init ? init.body : null;
        return typeof body === 'string' ? JSON.parse(body) : null;
      }),

    requestLines: (): readonly ContentText[] =>
      fetchProxy.allRequests().map((call) => {
        const [url, init] = call;
        const method =
          init !== null && typeof init === 'object' && 'method' in init ? String(init.method) : '?';
        return contentTextContract.parse(`${method} ${String(url)}`);
      }),
  };
};
