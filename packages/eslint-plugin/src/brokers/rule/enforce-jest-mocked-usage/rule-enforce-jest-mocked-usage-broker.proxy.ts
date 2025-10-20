import {
  eslintContextContract,
  type EslintContext,
} from '../../../contracts/eslint-context/eslint-context-contract';

export const ruleEnforceJestMockedUsageBrokerProxy = () => ({
  createContext: ({ filename }: { filename: string }): EslintContext => {
    const reportedMessages: unknown[] = [];

    const contextData = eslintContextContract.parse({
      filename,
    });

    return {
      ...contextData,
      report: (...args: unknown[]): void => {
        reportedMessages.push(args);
      },
    };
  },
});
