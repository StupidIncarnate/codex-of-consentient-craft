import { questListBroker } from './quest-list-broker';
import { questListBrokerProxy } from './quest-list-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

describe('questListBroker', () => {
  describe('listing quests', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => returns array of all quests from folders', async () => {
      const { questsFolderProxy, fsReaddirProxy, pathJoinProxy, questLoadProxy } =
        questListBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      questsFolderProxy.findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
      });
      questsFolderProxy.findProxy.pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      questsFolderProxy.mkdirProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      fsReaddirProxy.returns({
        files: [
          FileNameStub({ value: '001-quest-1' }),
          FileNameStub({ value: '002-quest-2' }),
          FileNameStub({ value: 'README.md' }), // Should be filtered out
          FileNameStub({ value: 'closed' }), // Should be filtered out
        ],
      });
      pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/001-quest-1/quest.json' }),
      });
      questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
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
      pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/002-quest-2/quest.json' }),
      });
      questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
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

      const result = await questListBroker({ startPath });

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('quest-1');
      expect(result[1]?.id).toBe('quest-2');
    });

    it('VALID: {startPath: "/project/file.ts"} => returns empty array when no quest folders exist', async () => {
      const { questsFolderProxy, fsReaddirProxy } = questListBrokerProxy();
      const startPath = FilePathStub({ value: '/project/file.ts' });

      questsFolderProxy.findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/file.ts',
        projectRootPath: '/project',
      });
      questsFolderProxy.findProxy.pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      questsFolderProxy.mkdirProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      fsReaddirProxy.returns({
        files: [
          FileNameStub({ value: 'README.md' }),
          FileNameStub({ value: 'closed' }), // Reserved folder, not a quest
        ],
      });

      const result = await questListBroker({ startPath });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {startPath: "/project/file.ts"} => returns empty array when quests folder is empty', async () => {
      const { questsFolderProxy, fsReaddirProxy } = questListBrokerProxy();
      const startPath = FilePathStub({ value: '/project/file.ts' });

      questsFolderProxy.findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/file.ts',
        projectRootPath: '/project',
      });
      questsFolderProxy.findProxy.pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      questsFolderProxy.mkdirProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      fsReaddirProxy.returns({ files: [] });

      const result = await questListBroker({ startPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {startPath: "/project/.hidden"} => handles hidden files as start path', async () => {
      const { questsFolderProxy, fsReaddirProxy, pathJoinProxy, questLoadProxy } =
        questListBrokerProxy();
      const startPath = FilePathStub({ value: '/project/.hidden' });

      questsFolderProxy.findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/.hidden',
        projectRootPath: '/project',
      });
      questsFolderProxy.findProxy.pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      questsFolderProxy.mkdirProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      fsReaddirProxy.returns({
        files: [FileNameStub({ value: '001-hidden-quest' })],
      });
      pathJoinProxy.returns({
        result: FilePathStub({
          value: '/project/.dungeonmaster-quests/001-hidden-quest/quest.json',
        }),
      });
      questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify({
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

      const result = await questListBroker({ startPath });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('hidden-quest');
    });
  });
});
