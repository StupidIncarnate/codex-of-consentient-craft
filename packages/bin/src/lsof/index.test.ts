import * as ourModule from './index';

describe('@dungeonmaster/bin/lsof', () => {
  it('VALID: {module} => exports listeningPids', () => {
    expect(Object.keys(ourModule).sort()).toStrictEqual(['listeningPids']);
  });
});
