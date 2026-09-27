import ourModule from './path';
import pkgModule from 'path';

describe('#gateway/node/path', () => {
  it('VALID: {module} => re-exports the same runtime binding as path', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
