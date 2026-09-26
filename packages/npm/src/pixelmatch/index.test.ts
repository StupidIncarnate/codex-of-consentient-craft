import ourModule from './index';
import pkgModule from 'pixelmatch';

describe('@dungeonmaster/npm/pixelmatch', () => {
  it('VALID: {module} => re-exports the same runtime binding as pixelmatch', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
