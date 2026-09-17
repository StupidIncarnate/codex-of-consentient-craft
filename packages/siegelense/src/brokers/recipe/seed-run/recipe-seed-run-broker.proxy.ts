// PURPOSE: Proxy for recipe-seed-run-broker — composes the book lookup's own proxy with the
// recipes package's dispatch proxy, so resolution, parameter grading, execution and the returns
// check all run REAL against the real book.
// USAGE: const proxy = recipeSeedRunBrokerProxy(); proxy.bookPresent(); proxy.guildLaneAnswers({...});

import type { ContentText } from '@dungeonmaster/shared/contracts';
import { recipeRunBrokerProxy } from '@dungeonmaster/siegelense-recipes/testing';

import { recipeBookReadBrokerProxy } from '../book-read/recipe-book-read-broker.proxy';

export const recipeSeedRunBrokerProxy = (): {
  bookPresent: () => void;
  bookPresentAt: (params: { packagePath: string }) => void;
  bookMissing: () => void;
  guildLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: unknown;
    questIds: readonly ContentText[];
  }) => void;
} => {
  const bookProxy = recipeBookReadBrokerProxy();
  const runProxy = recipeRunBrokerProxy();

  return {
    bookPresent: (): void => {
      bookProxy.setupPackagePresent();
    },

    // For a parent that already stages `process.cwd`/`path.join` of its own — see
    // `recipeBookReadBrokerProxy.setupPackagePresentAt` for why claiming them twice collides.
    bookPresentAt: ({ packagePath }: { packagePath: string }): void => {
      bookProxy.setupPackagePresentAt({ packagePath });
    },

    bookMissing: (): void => {
      bookProxy.setupPackageAbsent();
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
      runProxy.guildLaneAnswers({ apiBaseUrl, guild, questIds });
    },
  };
};
