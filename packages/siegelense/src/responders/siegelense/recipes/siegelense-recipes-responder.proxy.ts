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

import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { recipesReadBroker } from '../../../brokers/recipes/read/recipes-read-broker';
import { recipesReadBrokerProxy } from '../../../brokers/recipes/read/recipes-read-broker.proxy';
import type { RecipesListingStub } from '../../../contracts/recipes-listing/recipes-listing.stub';

// The directory the responder reads as where it runs; the repo root it hands down is this same path.
const CWD_VALUE = '/default/cwd';

type RecipesListing = ReturnType<typeof RecipesListingStub>;

export const SiegelenseRecipesResponderProxy = (): {
  stageListing: (params: { recipes: RecipesListing }) => void;
  stageError: (params: { error: Error }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages recipesReadBroker
  // directly below, never through its own setup methods.
  recipesReadBrokerProxy();

  const cwdStagingProxy = cwdProxy();
  cwdStagingProxy.setupCwd({ value: CWD_VALUE });
  const resolveProxy = cwdResolveBrokerProxy();
  resolveProxy.setupRepoRootFoundAtStart({ startPath: CWD_VALUE });

  const recipesReadHandle = registerMock({ fn: recipesReadBroker });
  const stdout = stdoutProxy();

  return {
    stageListing: ({ recipes }: { recipes: RecipesListing }): void => {
      recipesReadHandle.calledWith([{ repoRoot: CWD_VALUE }]).resolves(recipes);
    },

    stageError: ({ error }: { error: Error }): void => {
      recipesReadHandle.calledWith([{ repoRoot: CWD_VALUE }]).rejects(error);
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],
  };
};
