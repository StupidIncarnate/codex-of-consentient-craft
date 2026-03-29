/**
 * PURPOSE: Proxy for eslint-eslint-adapter that mocks ESLint instance creation
 *
 * USAGE:
 * const proxy = eslintEslintAdapterProxy();
 * proxy.returns({ eslint: mockEslintInstance });
 */
import { ESLint } from 'eslint';
import type { Linter } from 'eslint';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

// Auto-mock the eslint module via the AST transformer
registerModuleMock({ module: 'eslint' });

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

const createMockHandle = (): MockHandle => {
  const mockedConstructor = jest.fn();
  (ESLint as unknown as jest.Mock).mockImplementation(mockedConstructor);

  return {
    mockImplementation: (impl: (...args: never[]) => unknown): void => {
      mockedConstructor.mockImplementation(impl);
    },
    mockImplementationOnce: (impl: (...args: never[]) => unknown): void => {
      mockedConstructor.mockImplementationOnce(impl);
    },
    mockReturnValue: (val: unknown): void => {
      mockedConstructor.mockReturnValue(val);
    },
    mockReturnValueOnce: (val: unknown): void => {
      mockedConstructor.mockReturnValueOnce(val);
    },
    mockResolvedValue: (val: unknown): void => {
      mockedConstructor.mockResolvedValue(val);
    },
    mockResolvedValueOnce: (val: unknown): void => {
      mockedConstructor.mockResolvedValueOnce(val);
    },
    mockRejectedValueOnce: (val: unknown): void => {
      mockedConstructor.mockRejectedValueOnce(val);
    },
    mock: mockedConstructor.mock as unknown as { calls: unknown[][] },
    mockClear: (): void => {
      mockedConstructor.mockClear();
    },
  };
};

export const eslintEslintAdapterProxy = (): {
  returns: ({ config }: { config: Linter.Config }) => void;
  throws: ({ error }: { error: Error }) => void;
  setLintTextBehavior: (implementation: () => Promise<unknown[]>) => void;
  getLintTextHandler: () => jest.Mock;
  getLintFilesHandler: () => jest.Mock;
  getHandle: () => MockHandle;
} => {
  const MockESLintConstructor = createMockHandle();

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
    getHandle: () => MockESLintConstructor,
  };
};
