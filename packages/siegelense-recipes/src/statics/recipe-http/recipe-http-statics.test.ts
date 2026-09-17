import { recipeHttpStatics } from './recipe-http-statics';

describe('recipeHttpStatics', () => {
  it('VALID: exported value => matches the complete expected shape', () => {
    expect(recipeHttpStatics).toStrictEqual({
      methods: { get: 'GET', post: 'POST', patch: 'PATCH' },
      routes: { guilds: '/api/guilds', quests: '/api/quests' },
      limits: { errorBodyChars: 500 },
    });
  });
});
