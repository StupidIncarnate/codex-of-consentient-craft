/**
 * PURPOSE: Test proxy for SiegelenseRecipesResponder — mocks `recipeBookReadBroker` directly rather
 * than composing its own child proxies' staging, matching `SiegelenseStatusResponderProxy`'s shape
 * for the sibling call. `recipeBookReadBrokerProxy` is still constructed (never addressed further)
 * to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseRecipesResponderProxy();
 * proxy.stageAnswer({ answer });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { recipeBookReadBroker } from '../../../brokers/recipe/book-read/recipe-book-read-broker';
import { recipeBookReadBrokerProxy } from '../../../brokers/recipe/book-read/recipe-book-read-broker.proxy';
import type { RecipesAnswerStub } from '../../../contracts/recipes-answer/recipes-answer.stub';

type RecipesAnswer = ReturnType<typeof RecipesAnswerStub>;

export const SiegelenseRecipesResponderProxy = (): {
  stageAnswer: (params: { answer: RecipesAnswer }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages recipeBookReadBroker
  // directly below, never through its own setup methods.
  recipeBookReadBrokerProxy();

  const bookReadHandle = registerMock({ fn: recipeBookReadBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageAnswer: ({ answer }: { answer: RecipesAnswer }): void => {
      bookReadHandle.calledWith([]).resolves(answer);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};
