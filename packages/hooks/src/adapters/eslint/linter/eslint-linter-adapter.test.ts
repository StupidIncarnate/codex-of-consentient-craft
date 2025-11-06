import { eslintLinterAdapter } from './eslint-linter-adapter';
import { eslintLinterAdapterProxy } from './eslint-linter-adapter.proxy';
import type { Linter } from 'eslint';

describe('eslintLinterAdapter', () => {
  it('should create Linter instance', () => {
    const mockLinter = {} as Linter;
    eslintLinterAdapterProxy.mockReturnValue(mockLinter);

    const result = eslintLinterAdapter();

    expect(result).toBe(mockLinter);
  });
});
