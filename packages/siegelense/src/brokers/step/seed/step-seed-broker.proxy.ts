// PURPOSE: Proxy for step-seed-broker — composes `recipeSeedRunBroker`'s own proxy, so the book
// lookup, the parameter grading and the recipe itself all run REAL against the real book.
// USAGE: const proxy = stepSeedBrokerProxy(); proxy.bookPresent(); proxy.guildLaneAnswers({...});

import type { ContentText } from '@dungeonmaster/shared/contracts';

import { recipeSeedRunBrokerProxy } from '../../recipe/seed-run/recipe-seed-run-broker.proxy';

export const stepSeedBrokerProxy = (): {
  bookPresent: () => void;
  bookPresentAt: (params: { packagePath: string }) => void;
  guildLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: unknown;
    questIds: readonly ContentText[];
  }) => void;
} => {
  const seedRunProxy = recipeSeedRunBrokerProxy();

  return {
    bookPresent: (): void => {
      seedRunProxy.bookPresent();
    },

    bookPresentAt: ({ packagePath }: { packagePath: string }): void => {
      seedRunProxy.bookPresentAt({ packagePath });
    },

    guildLaneAnswers: ({
      apiBaseUrl,
      guild,
      questIds,
    }: {
      apiBaseUrl: ContentText;
      guild: unknown;
      questIds: readonly ContentText[];
    }): void => {
      seedRunProxy.guildLaneAnswers({ apiBaseUrl, guild, questIds });
    },
  };
};
