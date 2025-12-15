import { questAddBroker } from './quest-add-broker';
import { questAddBrokerProxy } from './quest-add-broker.proxy';
import { AddQuestInputStub } from '../../../contracts/add-quest-input/add-quest-input.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';

describe('questAddBroker', () => {
  it('VALID: {input: {title, userRequest, tasks: []}} => creates quest with sequence 001', async () => {
    const brokerProxy = questAddBrokerProxy();
    const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests/001-add-auth' });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/001-add-auth/quest.json',
    });

    brokerProxy.setupQuestCreation({
      questsPath,
      existingFolders: [],
      questFolderPath,
      questFilePath,
    });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants authentication',
      tasks: [],
    });

    const result = await questAddBroker({ input });

    expect(result.success).toBe(true);
    expect(result.questId).toBe('add-auth');
    expect(result.questFolder).toBe('001-add-auth');
    expect(result.filePath).toBe(questFilePath);
  });

  it('VALID: {input: {...}} with existing folders => creates quest with next sequence', async () => {
    const brokerProxy = questAddBrokerProxy();
    const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({
      value: '/project/.dungeonmaster-quests/003-fix-bug',
    });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/003-fix-bug/quest.json',
    });

    brokerProxy.setupQuestCreation({
      questsPath,
      existingFolders: [
        FolderNameStub({ value: '001-add-auth' }),
        FolderNameStub({ value: '002-add-logging' }),
      ],
      questFolderPath,
      questFilePath,
    });

    const input = AddQuestInputStub({
      title: 'Fix Bug',
      userRequest: 'User wants bug fixed',
      tasks: [],
    });

    const result = await questAddBroker({ input });

    expect(result.success).toBe(true);
    expect(result.questId).toBe('fix-bug');
    expect(result.questFolder).toBe('003-fix-bug');
  });

  it('VALID: {input: {title: "Add User Profile", ...}} => creates quest with kebab-case id', async () => {
    const brokerProxy = questAddBrokerProxy();
    const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({
      value: '/project/.dungeonmaster-quests/001-add-user-profile',
    });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/001-add-user-profile/quest.json',
    });

    brokerProxy.setupQuestCreation({
      questsPath,
      existingFolders: [],
      questFolderPath,
      questFilePath,
    });

    const input = AddQuestInputStub({
      title: 'Add User Profile',
      userRequest: 'User wants profile',
      tasks: [],
    });

    const result = await questAddBroker({ input });

    expect(result.success).toBe(true);
    expect(result.questId).toBe('add-user-profile');
    expect(result.questFolder).toBe('001-add-user-profile');
  });

  it('VALID: {input: {tasks: [task]}} => creates quest with tasks', async () => {
    const brokerProxy = questAddBrokerProxy();
    const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
    const questFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests/001-add-auth' });
    const questFilePath = FilePathStub({
      value: '/project/.dungeonmaster-quests/001-add-auth/quest.json',
    });

    brokerProxy.setupQuestCreation({
      questsPath,
      existingFolders: [],
      questFolderPath,
      questFilePath,
    });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants auth',
      tasks: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Create auth service',
          type: 'implementation',
          description: 'Implement authentication',
          dependencies: [],
          filesToCreate: ['src/auth.ts'],
        },
      ],
    });

    const result = await questAddBroker({ input });

    expect(result.success).toBe(true);
  });

  it('ERROR: mkdir fails => returns error result', async () => {
    const brokerProxy = questAddBrokerProxy();
    const questsPath = FilePathStub({ value: '/readonly/.dungeonmaster-quests' });

    brokerProxy.setupQuestCreationFailure({
      questsPath,
      error: new Error('Permission denied'),
    });

    const input = AddQuestInputStub({
      title: 'Add Auth',
      userRequest: 'User wants auth',
      tasks: [],
    });

    const result = await questAddBroker({ input });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Permission denied');
  });
});
