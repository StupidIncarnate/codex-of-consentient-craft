/**
 * PURPOSE: Proxy for eslint-output-fixes-adapter that mocks ESLint.outputFixes static method
 *
 * USAGE:
 * const proxy = eslintOutputFixesAdapterProxy();
 * proxy.writesSuccessfully();
 * await eslintOutputFixesAdapter({ results });
 */
import { ESLint } from 'eslint';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

export const eslintOutputFixesAdapterProxy = (): {
  writesSuccessfully: () => void;
  throwsError: (params: { error: Error }) => void;
  getOutputFixesHandler: () => SpyOnHandle;
} => {
  const mockOutputFixes: SpyOnHandle = registerSpyOn({ object: ESLint, method: 'outputFixes' });

  // Default behavior: successful write
  mockOutputFixes.mockResolvedValue(undefined);

  return {
    writesSuccessfully: (): void => {
      mockOutputFixes.mockResolvedValueOnce(undefined);
    },

    throwsError: ({ error }: { error: Error }): void => {
      mockOutputFixes.mockRejectedValueOnce(error);
    },

    getOutputFixesHandler: (): SpyOnHandle => mockOutputFixes,
  };
};
