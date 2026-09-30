import { getStdinProxy } from '#gateway/node/process/get-stdin/get-stdin.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { questionProxy } from '#gateway/node/readline/question/question.proxy';

export const createPackageResolveRequestBrokerProxy = (): {
  setupAnswers: (params: { name?: string; packageType?: string; description?: string }) => void;
  getPromptsAsked: () => readonly string[];
} => {
  const stdin = getStdinProxy();
  stdoutProxy();
  const question = questionProxy();

  return {
    setupAnswers: ({ name, packageType, description }): void => {
      stdin.setupStream();

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

    getPromptsAsked: (): readonly string[] =>
      question.getPromptsAsked().map((prompt) => prompt),
  };
};
