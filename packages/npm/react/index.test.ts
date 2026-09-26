import ourModule from './index';
import pkgModule from 'react';

describe('@dungeonmaster/npm/react', () => {
  it('VALID: {module} => re-exports the same runtime binding as react', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
