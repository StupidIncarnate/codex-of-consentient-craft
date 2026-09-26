import ourModule from './index';
import pkgModule from 'debug';

describe('@dungeonmaster/npm/debug', () => {
  it('VALID: {module} => re-exports the same runtime binding as debug', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
