/**
 * PURPOSE: Test proxy for SiegelenseRecipesResponder — mocks `recipesReadBroker` directly rather
 * than composing its own child proxies' staging, matching `SiegelenseCleanupResponderProxy`'s shape
 * for the sibling command. `recipesReadBrokerProxy` is still constructed (never addressed further)
 * to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseRecipesResponderProxy();
 * proxy.stageListing({ recipes });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { recipesReadBroker } from '../../../brokers/recipes/read/recipes-read-broker';
import { recipesReadBrokerProxy } from '../../../brokers/recipes/read/recipes-read-broker.proxy';
import type { RecipesListingStub } from '../../../contracts/recipes-listing/recipes-listing.stub';

type RecipesListing = ReturnType<typeof RecipesListingStub>;

export const SiegelenseRecipesResponderProxy = (): {
  stageListing: (params: { recipes: RecipesListing }) => void;
  stageError: (params: { error: Error }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages recipesReadBroker
  // directly below, never through its own setup methods.
  recipesReadBrokerProxy();

  const recipesReadHandle = registerMock({ fn: recipesReadBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageListing: ({ recipes }: { recipes: RecipesListing }): void => {
      recipesReadHandle.calledWith([]).resolves(recipes);
    },

    stageError: ({ error }: { error: Error }): void => {
      recipesReadHandle.calledWith([]).rejects(error);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};
