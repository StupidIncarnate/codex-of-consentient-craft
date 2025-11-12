/**
 * PURPOSE: Proxy for eslint-eslint-adapter that mocks ESLint instance creation
 *
 * USAGE:
 * const proxy = eslintEslintAdapterProxy();
 * proxy.returns({ eslint: mockEslintInstance });
 */
jest.mock('eslint');

import { ESLint } from 'eslint';
import type { Linter } from 'eslint';

// Module-level mock functions that can be accessed across all proxy calls
const mockCalculateConfigForFile = jest.fn();
const mockLintText = jest.fn();
const mockLintFiles = jest.fn();

// Create mock instance that passes instanceof checks
const mockEslintInstance = Object.create(ESLint.prototype) as ESLint;
mockEslintInstance.calculateConfigForFile =
  mockCalculateConfigForFile as ESLint['calculateConfigForFile'];
mockEslintInstance.lintText = mockLintText as ESLint['lintText'];
mockEslintInstance.lintFiles = mockLintFiles as ESLint['lintFiles'];

export const eslintEslintAdapterProxy = (): {
  returns: ({ config }: { config: Linter.Config }) => void;
  throws: ({ error }: { error: Error }) => void;
  setLintTextBehavior: (implementation: () => Promise<unknown[]>) => void;
  getLintTextHandler: () => jest.Mock;
  getLintFilesHandler: () => jest.Mock;
} => {
  const MockESLintConstructor = jest.mocked(ESLint);

  // Default: return mock instance when constructor is called
  MockESLintConstructor.mockImplementation(() => mockEslintInstance);

  // Default: calculateConfigForFile returns empty config
  mockCalculateConfigForFile.mockResolvedValue({});

  // Default: lintText returns empty results
  mockLintText.mockResolvedValue([]);

  // Default: lintFiles returns empty results
  mockLintFiles.mockResolvedValue([]);

  return {
    returns: ({ config }: { config: Linter.Config }) => {
      mockCalculateConfigForFile.mockResolvedValueOnce(config);
    },
    throws: ({ error }: { error: Error }) => {
      MockESLintConstructor.mockImplementationOnce(() => {
        throw error;
      });
    },
    setLintTextBehavior: (implementation: () => Promise<unknown[]>) => {
      mockLintText.mockImplementation(implementation);
    },
    getLintTextHandler: () => mockLintText,
    getLintFilesHandler: () => mockLintFiles,
  };
};
