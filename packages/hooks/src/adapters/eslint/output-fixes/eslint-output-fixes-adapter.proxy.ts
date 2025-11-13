/**
 * PURPOSE: Proxy for eslint-output-fixes-adapter that mocks ESLint.outputFixes static method
 *
 * USAGE:
 * const proxy = eslintOutputFixesAdapterProxy();
 * proxy.writesSuccessfully();
 * await eslintOutputFixesAdapter({ results });
 */
jest.mock('eslint');

import { ESLint } from 'eslint';

// Module-level mock function
const mockOutputFixes = jest.fn();

// Mock the static method once at module level
const MockedESLint = jest.mocked(ESLint);
// Type assertion needed: jest.fn() runtime compatible with static method, but type system requires MockedFunctionDeep
MockedESLint.outputFixes = mockOutputFixes as never;

export const eslintOutputFixesAdapterProxy = (): {
  writesSuccessfully: () => void;
  throwsError: (params: { error: Error }) => void;
  getOutputFixesHandler: () => jest.Mock;
} => {
  // Default behavior: successful write
  mockOutputFixes.mockResolvedValue(undefined);

  return {
    writesSuccessfully: (): void => {
      mockOutputFixes.mockResolvedValueOnce(undefined);
    },

    throwsError: ({ error }: { error: Error }): void => {
      mockOutputFixes.mockRejectedValueOnce(error);
    },

    getOutputFixesHandler: (): jest.Mock => mockOutputFixes,
  };
};
