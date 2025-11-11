import { eslintLinterAdapter } from './eslint-linter-adapter';
import { eslintLinterAdapterProxy } from './eslint-linter-adapter.proxy';
import { Linter } from 'eslint';

describe('eslintLinterAdapter', () => {
  it('VALID: {} => creates Linter instance', () => {
    eslintLinterAdapterProxy();

    const result = eslintLinterAdapter();

    expect(result).toBeInstanceOf(Linter);
  });
});
