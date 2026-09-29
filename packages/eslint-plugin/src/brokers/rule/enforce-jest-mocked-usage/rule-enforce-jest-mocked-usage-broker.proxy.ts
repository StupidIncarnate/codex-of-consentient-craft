import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';

export const ruleEnforceJestMockedUsageBrokerProxy = (): {
  createContext: ({ filename }: { filename: string }) => TSESLint.RuleContext<string, unknown[]>;
} => ({
  createContext: ({ filename }: { filename: string }): TSESLint.RuleContext<string, unknown[]> => {
    const reportedMessages: unknown[] = [];

    return RuleContextStub({
      filename,
      report: (...args: unknown[]): void => {
        reportedMessages.push(args);
      },
    });
  },
});
