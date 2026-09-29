import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import { stdinProxy } from '#gateway/node/process/stdin/stdin.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { questionProxy } from '#gateway/node/readline/question/question.proxy';

export const createPackageResolveRequestBrokerProxy = (): {
  setupAnswers: (params: { name?: string; packageType?: string; description?: string }) => void;
  getPromptsAsked: () => readonly ContentText[];
} => {
  stdinProxy();
  stdoutProxy();
  const question = questionProxy();

  return {
    setupAnswers: ({ name, packageType, description }): void => {
      if (name !== undefined) {
        question.answers({ prompt: 'Package name: ', answer: name });
      }

      if (packageType !== undefined) {
        question.answers({ prompt: 'Package type: ', answer: packageType });
      }

      if (description !== undefined) {
        question.answers({ prompt: 'Description: ', answer: description });
      }
    },

    getPromptsAsked: (): readonly ContentText[] =>
      question.getPromptsAsked().map((prompt) => contentTextContract.parse(prompt)),
  };
};
