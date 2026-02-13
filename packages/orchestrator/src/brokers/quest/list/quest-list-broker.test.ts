import { questListBroker } from './quest-list-broker';
import { questListBrokerProxy } from './quest-list-broker.proxy';
import { FilePathStub, ProjectIdStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

describe('questListBroker', () => {
  describe('listing quests', () => {
    it('VALID: {projectId} => returns array of all quests from folders', async () => {
      const proxy = questListBrokerProxy();
      const projectId = ProjectIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [
          FileNameStub({ value: '001-quest-1' }),
          FileNameStub({ value: '002-quest-2' }),
          FileNameStub({ value: 'README.md' }), // Should be filtered out
          FileNameStub({ value: 'closed' }), // Should be filtered out
        ],
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/001-quest-1/quest.json' }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'quest-1',
          folder: '001-quest-1',
          title: 'Quest 1',
          status: 'in_progress',
          createdAt: '2024-01-01T00:00:00Z',
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'in_progress' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
          executionLog: [],
          tasks: [],
          contexts: [],
          observables: [],
          steps: [],
          toolingRequirements: [],
        }),
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/002-quest-2/quest.json' }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'quest-2',
          folder: '002-quest-2',
          title: 'Quest 2',
          status: 'complete',
          createdAt: '2024-01-02T00:00:00Z',
          completedAt: '2024-01-03T00:00:00Z',
          phases: {
            discovery: { status: 'complete' },
            implementation: { status: 'complete' },
            testing: { status: 'complete' },
            review: { status: 'complete' },
          },
          executionLog: [],
          tasks: [],
          contexts: [],
          observables: [],
          steps: [],
          toolingRequirements: [],
        }),
      });

      const result = await questListBroker({ projectId });

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('quest-1');
      expect(result[1]?.id).toBe('quest-2');
    });

    it('VALID: {projectId} => returns empty array when no quest folders exist', async () => {
      const proxy = questListBrokerProxy();
      const projectId = ProjectIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [
          FileNameStub({ value: 'README.md' }),
          FileNameStub({ value: 'closed' }), // Reserved folder, not a quest
        ],
      });

      const result = await questListBroker({ projectId });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {projectId} => returns empty array when quests folder is empty', async () => {
      const proxy = questListBrokerProxy();
      const projectId = ProjectIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({ files: [] });

      const result = await questListBroker({ projectId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {projectId with hidden files} => handles hidden files in quest folder', async () => {
      const proxy = questListBrokerProxy();
      const projectId = ProjectIdStub();

      proxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        questsPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [FileNameStub({ value: '001-hidden-quest' })],
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({
          value: '/project/.dungeonmaster-quests/001-hidden-quest/quest.json',
        }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify({
          id: 'hidden-quest',
          folder: '001-hidden-quest',
          title: 'Hidden Quest',
          status: 'in_progress',
          createdAt: '2024-01-01T00:00:00Z',
          phases: {
            discovery: { status: 'pending' },
            implementation: { status: 'pending' },
            testing: { status: 'pending' },
            review: { status: 'pending' },
          },
          executionLog: [],
          tasks: [],
          contexts: [],
          observables: [],
          steps: [],
          toolingRequirements: [],
        }),
      });

      const result = await questListBroker({ projectId });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('hidden-quest');
    });
  });
});
