import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

export const enforceJestMockedUsageRuleBrokerProxy = () => ({
  createContext: ({ filename }: { filename: string }): EslintContext => {
    const reportedMessages: unknown[] = [];

    return {
      filename,
      report: (...args: unknown[]): void => {
        reportedMessages.push(args);
      },
    };
  },
});
