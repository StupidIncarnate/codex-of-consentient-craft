import type { QuestStub } from '@dungeonmaster/shared/contracts';
import {
  AddQuestInputStub,
  FilePathStub,
  GuildIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { questCreateBroker } from './quest-create-broker';
import { questCreateBrokerProxy } from './quest-create-broker.proxy';

const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

describe('questCreateBroker', () => {
  it('VALID: {questId, guildId, input} => writes quest.json at status created with empty-array defaults + the chaoswhisperer plan operation item', async () => {
    const brokerProxy = questCreateBrokerProxy();
    const questId = QuestIdStub({ value: 'add-auth-quest' });
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({
      value: '/project/.dungeonmaster-quests/add-auth-quest',
    });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/add-auth-quest/quest.json',
    });

    brokerProxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants authentication',
    });

    const result = await questCreateBroker({ questId, guildId, input });

    expect(result).toStrictEqual({ questFilePath, questFolderPath });

    const writtenQuest = JSON.parse(brokerProxy.getWrittenContent() as never);
    const { createdAt, operations, ...rest } = writtenQuest;
    // The plan operation item's id is a generated UUID — assert its shape separately.
    const [planOp] = operations;
    const { id: planOpId, ...planOpRest } = planOp;

    expect(createdAt).toMatch(ISO_TIMESTAMP_PATTERN);
    expect(rest).toStrictEqual({
      id: 'add-auth-quest',
      folder: 'add-auth-quest',
      title: 'Add Auth',
      status: 'created',
      questType: 'feature',
      userRequest: 'User wants authentication',
      designDecisions: [],
      toolingRequirements: [],
      packagesAffected: [],
      contracts: [],
      flows: [],
      needsDesign: false,
      workItems: [],
      wardResults: [],
      planningNotes: { blightReports: [] },
    });
    expect(planOpId).toMatch(UUID_PATTERN);
    expect(planOpRest).toStrictEqual({
      role: 'chaoswhisperer',
      text: 'Author spec + implementation plan',
      status: 'in_progress',
      locked: true,
    });
  });

  it('VALID: {input: {questSource: "smoketest-mcp"}} => persists questSource onto the written quest', async () => {
    const brokerProxy = questCreateBrokerProxy();
    const questId = QuestIdStub({ value: 'smoketest-quest' });
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({
      value: '/project/.dungeonmaster-quests/smoketest-quest',
    });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/smoketest-quest/quest.json',
    });

    brokerProxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

    const input = AddQuestInputStub({
      title: 'Smoketest Quest',
      userRequest: 'Smoketest user request',
      questSource: 'smoketest-mcp',
    });

    await questCreateBroker({ questId, guildId, input });

    const writtenQuest: ReturnType<typeof QuestStub> = JSON.parse(
      brokerProxy.getWrittenContent() as never,
    );
    const { questSource } = writtenQuest;

    expect(questSource).toBe('smoketest-mcp');
  });

  it('VALID: {input: {questType: "bug-hunt"}} => persists questType onto the written quest', async () => {
    const brokerProxy = questCreateBrokerProxy();
    const questId = QuestIdStub({ value: 'bug-hunt-quest' });
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({
      value: '/project/.dungeonmaster-quests/bug-hunt-quest',
    });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/bug-hunt-quest/quest.json',
    });

    brokerProxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

    const input = AddQuestInputStub({
      title: 'Fix Bug',
      userRequest: 'The tool result is not rendering',
      questType: 'bug-hunt',
    });

    await questCreateBroker({ questId, guildId, input });

    const writtenQuest: ReturnType<typeof QuestStub> = JSON.parse(
      brokerProxy.getWrittenContent() as never,
    );
    const { questType } = writtenQuest;

    expect(questType).toBe('bug-hunt');
  });

  it('VALID: {input without questType} => written quest defaults questType to feature', async () => {
    const brokerProxy = questCreateBrokerProxy();
    const questId = QuestIdStub({ value: 'feature-quest' });
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({
      value: '/project/.dungeonmaster-quests/feature-quest',
    });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/feature-quest/quest.json',
    });

    brokerProxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

    const input = AddQuestInputStub({ title: 'Add Auth', userRequest: 'User wants auth' });

    await questCreateBroker({ questId, guildId, input });

    const writtenQuest: ReturnType<typeof QuestStub> = JSON.parse(
      brokerProxy.getWrittenContent() as never,
    );
    const { questType } = writtenQuest;

    expect(questType).toBe('feature');
  });

  it('VALID: {input without questSource} => written quest omits questSource field', async () => {
    const brokerProxy = questCreateBrokerProxy();
    const questId = QuestIdStub({ value: 'plain-quest' });
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({
      value: '/project/.dungeonmaster-quests/plain-quest',
    });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/plain-quest/quest.json',
    });

    brokerProxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

    const input = AddQuestInputStub({
      title: 'Plain Quest',
      userRequest: 'Plain user request',
    });

    await questCreateBroker({ questId, guildId, input });

    const writtenQuest: ReturnType<typeof QuestStub> = JSON.parse(
      brokerProxy.getWrittenContent() as never,
    );
    const { questSource } = writtenQuest;

    expect(questSource).toBe(undefined);
  });

  it('ERROR: {mkdir fails on quests base dir} => throws the underlying error', async () => {
    const brokerProxy = questCreateBrokerProxy();
    const questId = QuestIdStub({ value: 'failed-quest' });
    const guildId = GuildIdStub();
    const questsFolderPath = FilePathStub({ value: '/readonly/.dungeonmaster-quests' });

    brokerProxy.setupQuestCreationFailure({
      questsFolderPath,
      error: new Error('Permission denied'),
    });

    const input = AddQuestInputStub({
      title: 'Failed Quest',
      userRequest: 'Will fail',
    });

    await expect(questCreateBroker({ questId, guildId, input })).rejects.toThrow(
      'Permission denied',
    );
  });
});
