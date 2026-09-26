import ourModule from './index';
import pkgModule from 'eslint-plugin-jest';

describe('@dungeonmaster/npm/eslint-plugin-jest', () => {
  it('VALID: {module} => re-exports the same runtime binding as eslint-plugin-jest', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
