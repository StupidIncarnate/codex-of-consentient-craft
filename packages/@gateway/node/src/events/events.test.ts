import ourModule from './events';
import pkgModule from 'events';

describe('#gateway/node/events', () => {
  it('VALID: {module} => re-exports the same runtime binding as events', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
