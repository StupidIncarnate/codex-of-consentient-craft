import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import { questionProxy } from '#gateway/node/readline/question/question.proxy';

export const createPackageResolveRequestBrokerProxy = (): {
  setupAnswers: (params: { name?: string; packageType?: string; description?: string }) => void;
  getPromptsAsked: () => readonly ContentText[];
} => {
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
