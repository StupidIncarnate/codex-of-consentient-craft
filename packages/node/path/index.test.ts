import ourModule from './index';
import pkgModule from 'path';

describe('@dungeonmaster/node/path', () => {
  it('VALID: {module} => re-exports the same runtime binding as path', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
