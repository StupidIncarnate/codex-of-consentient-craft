// PURPOSE: Proxy for recipe-run-broker — composes both recipe brokers' own proxies, so routing is
// proved against the real recipes rather than against a mocked dispatch.
// USAGE: const proxy = recipeRunBrokerProxy(); proxy.laneAnswers({ apiBaseUrl, guild, questIds, transcriptPaths });

import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { recipesGuildWithThreeQuestsBrokerProxy } from '../../recipes/guild-with-three-quests/recipes-guild-with-three-quests-broker.proxy';
import { recipesSessionWithNestedSubagentBrokerProxy } from '../../recipes/session-with-nested-subagent/recipes-session-with-nested-subagent-broker.proxy';

export const recipeRunBrokerProxy = (): {
  guildLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: unknown;
    questIds: readonly ContentText[];
  }) => void;
  sessionLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guilds: unknown;
    transcriptPaths: readonly AbsoluteFilePath[];
  }) => void;
  filesWritten: () => readonly unknown[];
  requestLines: () => readonly ContentText[];
} => {
  const guildProxy = recipesGuildWithThreeQuestsBrokerProxy();
  const sessionProxy = recipesSessionWithNestedSubagentBrokerProxy();

  return {
    guildLaneAnswers: ({
      apiBaseUrl,
      guild,
      questIds,
    }: {
      apiBaseUrl: ContentText;
      guild: unknown;
      questIds: readonly ContentText[];
    }): void => {
      guildProxy.laneAnswers({ apiBaseUrl, guild, questIds });
    },

    sessionLaneAnswers: ({
      apiBaseUrl,
      guilds,
      transcriptPaths,
    }: {
      apiBaseUrl: ContentText;
      guilds: unknown;
      transcriptPaths: readonly AbsoluteFilePath[];
    }): void => {
      sessionProxy.laneAnswers({ apiBaseUrl, guilds, transcriptPaths });
    },

    filesWritten: (): readonly unknown[] => sessionProxy.filesWritten(),

    requestLines: (): readonly ContentText[] => guildProxy.requestLines(),
  };
};
