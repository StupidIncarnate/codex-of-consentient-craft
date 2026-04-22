import { environmentStatics } from './environment-statics';

describe('environmentStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(environmentStatics).toStrictEqual({
      defaultPort: 3737,
      hostname: 'dungeonmaster.localhost',
      serverUrlPlaceholder: '{{SERVER_URL}}',
    });
  });
});
