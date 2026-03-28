import { environmentStatics } from './environment-statics';

describe('environmentStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(environmentStatics).toStrictEqual({
      defaultPort: 3737,
      hostname: 'dungeonmaster.localhost',
      dataDir: '.dungeonmaster',
      devDataDir: '.dungeonmaster-dev',
      testDataDir: '.dungeonmaster-test',
      devPort: 4737,
      testPort: 5737,
      serverUrlPlaceholder: '{{SERVER_URL}}',
    });
  });
});
