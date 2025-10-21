import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';

export const ruleEnforceJestMockedUsageBrokerProxy = (): {
  createContext: ({ filename }: { filename: string }) => EslintContext;
} => ({
  createContext: ({ filename }: { filename: string }): EslintContext => {
    const reportedMessages: unknown[] = [];

    return EslintContextStub({
      filename,
      report: (...args: unknown[]): void => {
        reportedMessages.push(args);
      },
    });
  },
});
