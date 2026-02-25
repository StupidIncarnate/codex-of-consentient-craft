import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { AddQuestInputStub } from '../../../contracts/add-quest-input/add-quest-input.stub';
import { questAddBroker } from './quest-add-broker';
import { questAddBrokerProxy } from './quest-add-broker.proxy';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

describe('questAddBroker', () => {
  it('VALID: {input: {title, userRequest}} => returns success with UUID quest id', async () => {
    const brokerProxy = questAddBrokerProxy();
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests/uuid-folder' });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/uuid-folder/quest.json',
    });

    brokerProxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants authentication',
    });

    const result = await questAddBroker({ input, guildId });

    expect(result.success).toBe(true);
    expect(result.questId).toMatch(UUID_PATTERN);
    expect(result.filePath).toBe(questFilePath);
  });

  it('VALID: {input: {title, userRequest}} => quest folder equals quest id (UUID)', async () => {
    const brokerProxy = questAddBrokerProxy();
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests/uuid-folder' });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/uuid-folder/quest.json',
    });

    brokerProxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants authentication',
    });

    const result = await questAddBroker({ input, guildId });

    expect(result.questFolder).toBe(result.questId);
    expect(result.questFolder).toMatch(UUID_PATTERN);
  });

  it('VALID: {input: {title, userRequest}} => creates quest with status created', async () => {
    const brokerProxy = questAddBrokerProxy();
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests/uuid-folder' });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/uuid-folder/quest.json',
    });

    brokerProxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants authentication',
    });

    await questAddBroker({ input, guildId });

    const writtenQuest = JSON.parse(brokerProxy.getWrittenContent() as never);

    expect(writtenQuest.status).toBe('created');
  });

  it('VALID: {input: {title, userRequest}} => written quest JSON has UUID id and folder', async () => {
    const brokerProxy = questAddBrokerProxy();
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests/uuid-folder' });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/uuid-folder/quest.json',
    });

    brokerProxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants authentication',
    });

    await questAddBroker({ input, guildId });

    const writtenQuest = JSON.parse(brokerProxy.getWrittenContent() as never);

    expect(writtenQuest.id).toMatch(UUID_PATTERN);
    expect(writtenQuest.folder).toBe(writtenQuest.id);
  });

  it('VALID: {two quests with same title} => creates quests with different UUIDs', async () => {
    const guildId = GuildIdStub();

    // First quest
    const brokerProxy1 = questAddBrokerProxy();
    const questsFolderPath1 = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath1 = FilePathStub({
      value: '/project/.dungeonmaster-quests/uuid-folder-1',
    });
    const questFilePath1 = FilePathStub({
      value: '/project/.dungeonmaster-quests/uuid-folder-1/quest.json',
    });

    brokerProxy1.setupQuestCreation({
      questsFolderPath: questsFolderPath1,
      questFolderPath: questFolderPath1,
      questFilePath: questFilePath1,
    });

    const input1 = AddQuestInputStub({
      title: 'New Quest',
      userRequest: 'First request',
    });

    const result1 = await questAddBroker({ input: input1, guildId });

    // Second quest
    const brokerProxy2 = questAddBrokerProxy();
    const questsFolderPath2 = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath2 = FilePathStub({
      value: '/project/.dungeonmaster-quests/uuid-folder-2',
    });
    const questFilePath2 = FilePathStub({
      value: '/project/.dungeonmaster-quests/uuid-folder-2/quest.json',
    });

    brokerProxy2.setupQuestCreation({
      questsFolderPath: questsFolderPath2,
      questFolderPath: questFolderPath2,
      questFilePath: questFilePath2,
    });

    const input2 = AddQuestInputStub({
      title: 'New Quest',
      userRequest: 'Second request',
    });

    const result2 = await questAddBroker({ input: input2, guildId });

    expect(result1.questId).not.toBe(result2.questId);
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
