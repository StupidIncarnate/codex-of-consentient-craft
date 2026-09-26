import ourModule from './index';
import pkgModule from 'events';

describe('@dungeonmaster/node/events', () => {
  it('VALID: {module} => re-exports the same runtime binding as events', () => {
    expect(ourModule).toBe(pkgModule);
  });
});
