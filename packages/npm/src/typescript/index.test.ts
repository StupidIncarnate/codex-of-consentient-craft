import ourModule from './index';
import pkgModule from 'typescript';

describe('@dungeonmaster/npm/typescript', () => {
  it('VALID: {module} => re-exports the same runtime binding as typescript', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
