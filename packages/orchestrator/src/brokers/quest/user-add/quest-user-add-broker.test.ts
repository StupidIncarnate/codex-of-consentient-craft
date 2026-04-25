import { AddQuestInputStub, FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { questUserAddBroker } from './quest-user-add-broker';
import { questUserAddBrokerProxy } from './quest-user-add-broker.proxy';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

describe('questUserAddBroker', () => {
  it('VALID: {input, guildId} => returns success with UUID questId, questFolder equals questId, and filePath from questCreateBroker', async () => {
    const brokerProxy = questUserAddBrokerProxy();
    const guildId = GuildIdStub();
    const questFilePath = FilePathStub({
      value: '/home/testuser/.dungeonmaster/guilds/g/quests/q/quest.json',
    });
    const questFolderPath = FilePathStub({
      value: '/home/testuser/.dungeonmaster/guilds/g/quests/q',
    });

    brokerProxy.setupQuestCreation({ questFilePath, questFolderPath });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants authentication',
    });

    const result = await questUserAddBroker({ input, guildId });

    expect(result).toStrictEqual({
      success: true,
      questId: expect.stringMatching(UUID_PATTERN),
      questFolder: expect.stringMatching(UUID_PATTERN),
      filePath: questFilePath,
    });
    expect(result.questFolder).toBe(result.questId);
  });

  it('ERROR: {questCreateBroker throws} => returns failure result with error message', async () => {
    const brokerProxy = questUserAddBrokerProxy();
    const guildId = GuildIdStub();

    brokerProxy.setupCreateFailure({ error: new Error('Permission denied') });

    const input = AddQuestInputStub({ title: 'Add Auth', userRequest: 'User wants auth' });

    const result = await questUserAddBroker({ input, guildId });

    expect(result).toStrictEqual({
      success: false,
      error: 'Permission denied',
    });
  });
});
