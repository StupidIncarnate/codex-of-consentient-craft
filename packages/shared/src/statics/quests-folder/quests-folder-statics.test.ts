import { questsFolderStatics } from './quests-folder-statics';

describe('questsFolderStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questsFolderStatics).toStrictEqual({
      paths: {
        root: '.dungeonmaster-quests',
        closed: 'closed',
      },
      files: {
        extension: '.json',
        packageJson: 'package.json',
      },
    });
  });
});
