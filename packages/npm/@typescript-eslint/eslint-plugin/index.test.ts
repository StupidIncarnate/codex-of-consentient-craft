import ourModule from './index';
import pkgModule from '@typescript-eslint/eslint-plugin';

describe('@dungeonmaster/npm/@typescript-eslint/eslint-plugin', () => {
  it('VALID: {module} => re-exports the same runtime binding as @typescript-eslint/eslint-plugin', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
