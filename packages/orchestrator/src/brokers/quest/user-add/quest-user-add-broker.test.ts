import {
  AddQuestInputStub,
  FilePathStub,
  GuildIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

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
      chaoswhispererWorkItemId: expect.stringMatching(UUID_PATTERN),
    });
    expect(result.questFolder).toBe(result.questId);
  });

  it('VALID: {input, guildId, sessionId} => stamps sessionId on the chaoswhisperer seed work item', async () => {
    const brokerProxy = questUserAddBrokerProxy();
    const guildId = GuildIdStub();
    const sessionId = SessionIdStub({ value: 'aaaaaaaa-1111-4222-9333-aaaaaaaaaaaa' });

    await questUserAddBroker({ input: AddQuestInputStub(), guildId, sessionId });

    const [chaosItem] = brokerProxy.getLastInitialWorkItems();

    expect(chaosItem?.role).toBe('chaoswhisperer');
    expect(chaosItem?.sessionId).toBe(sessionId);
  });

  it('VALID: {input, guildId, no sessionId} => chaoswhisperer work item has no sessionId field', async () => {
    const brokerProxy = questUserAddBrokerProxy();
    const guildId = GuildIdStub();

    await questUserAddBroker({ input: AddQuestInputStub(), guildId });

    const [chaosItem] = brokerProxy.getLastInitialWorkItems();

    expect(chaosItem?.role).toBe('chaoswhisperer');
    expect(chaosItem?.sessionId).toBe(undefined);
  });

  it('VALID: {input.questType: "bug-hunt"} => seeds no work item and omits chaoswhispererWorkItemId', async () => {
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
      title: 'Fix Bug',
      userRequest: 'The tool result is not rendering',
      questType: 'bug-hunt',
    });

    const result = await questUserAddBroker({ input, guildId });

    expect(result).toStrictEqual({
      success: true,
      questId: expect.stringMatching(UUID_PATTERN),
      questFolder: expect.stringMatching(UUID_PATTERN),
      filePath: questFilePath,
    });
    expect(brokerProxy.getLastInitialWorkItems()).toStrictEqual([]);
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
