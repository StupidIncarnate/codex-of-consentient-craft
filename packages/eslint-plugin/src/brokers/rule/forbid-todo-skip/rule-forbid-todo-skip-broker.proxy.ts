import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for forbid-todo-skip rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleForbidTodoSkipBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
