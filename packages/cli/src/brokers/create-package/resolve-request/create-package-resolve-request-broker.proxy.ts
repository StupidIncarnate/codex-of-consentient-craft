import { readlineQuestionAdapterProxy } from '../../../adapters/readline/question/readline-question-adapter.proxy';

export const createPackageResolveRequestBrokerProxy = (): {
  setupAnswers: (params: { name?: string; packageType?: string; description?: string }) => void;
} => {
  const readlineProxy = readlineQuestionAdapterProxy();

  return {
    setupAnswers: ({ name, packageType, description }): void => {
      if (name !== undefined) {
        readlineProxy.setupAnswer({ prompt: 'Package name: ', answer: name });
      }

      if (packageType !== undefined) {
        readlineProxy.setupAnswer({ prompt: 'Package type: ', answer: packageType });
      }

      if (description !== undefined) {
        readlineProxy.setupAnswer({ prompt: 'Description: ', answer: description });
      }
    },
  };
};
