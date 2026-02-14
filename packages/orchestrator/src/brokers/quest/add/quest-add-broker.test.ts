import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { AddQuestInputStub } from '../../../contracts/add-quest-input/add-quest-input.stub';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { questAddBroker } from './quest-add-broker';
import { questAddBrokerProxy } from './quest-add-broker.proxy';

describe('questAddBroker', () => {
  it('VALID: {input: {title, userRequest}} => creates quest with sequence 001', async () => {
    const brokerProxy = questAddBrokerProxy();
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests/001-add-auth' });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/001-add-auth/quest.json',
    });

    brokerProxy.setupQuestCreation({
      questsFolderPath,
      existingFolders: [],
      questFolderPath,
      questFilePath,
    });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants authentication',
    });

    const result = await questAddBroker({ input, guildId });

    expect(result.success).toBe(true);
    expect(result.questId).toBe('add-auth');
    expect(result.questFolder).toBe('001-add-auth');
    expect(result.filePath).toBe(questFilePath);
  });

  it('VALID: {input: {...}} with existing folders => creates quest with next sequence', async () => {
    const brokerProxy = questAddBrokerProxy();
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({
      value: '/project/.dungeonmaster-quests/003-fix-bug',
    });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/003-fix-bug/quest.json',
    });

    brokerProxy.setupQuestCreation({
      questsFolderPath,
      existingFolders: [
        FileNameStub({ value: '001-add-auth' }),
        FileNameStub({ value: '002-add-logging' }),
      ],
      questFolderPath,
      questFilePath,
    });

    const input = AddQuestInputStub({
      title: 'Fix Bug',
      userRequest: 'User wants bug fixed',
    });

    const result = await questAddBroker({ input, guildId });

    expect(result.success).toBe(true);
    expect(result.questId).toBe('fix-bug');
    expect(result.questFolder).toBe('003-fix-bug');
  });

  it('VALID: {input: {title: "Add User Profile", ...}} => creates quest with kebab-case id', async () => {
    const brokerProxy = questAddBrokerProxy();
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({
      value: '/project/.dungeonmaster-quests/001-add-user-profile',
    });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/001-add-user-profile/quest.json',
    });

    brokerProxy.setupQuestCreation({
      questsFolderPath,
      existingFolders: [],
      questFolderPath,
      questFilePath,
    });

    const input = AddQuestInputStub({
      title: 'Add User Profile',
      userRequest: 'User wants profile',
    });

    const result = await questAddBroker({ input, guildId });

    expect(result.success).toBe(true);
    expect(result.questId).toBe('add-user-profile');
    expect(result.questFolder).toBe('001-add-user-profile');
  });

  it('ERROR: mkdir fails => returns error result', async () => {
    const brokerProxy = questAddBrokerProxy();
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/readonly/.dungeonmaster-quests' });

    brokerProxy.setupQuestCreationFailure({
      questsFolderPath,
      error: new Error('Permission denied'),
    });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants auth',
    });

    const result = await questAddBroker({ input, guildId });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Permission denied');
  });
});
