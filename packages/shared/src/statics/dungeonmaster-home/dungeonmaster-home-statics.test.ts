import { dungeonmasterHomeStatics } from './dungeonmaster-home-statics';

describe('dungeonmasterHomeStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(dungeonmasterHomeStatics).toStrictEqual({
      paths: {
        projectConfigFile: '.dungeonmaster.json',
        legacyProjectConfigFile: '.dungeonmaster',
        configDir: '.dungeonmaster',
        configFile: 'config.json',
        guildsDir: 'guilds',
        questsDir: 'quests',
        questFile: 'quest.json',
      },
    });
  });
});
