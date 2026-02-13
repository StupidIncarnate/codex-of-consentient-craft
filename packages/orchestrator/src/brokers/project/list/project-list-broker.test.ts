import { FilePathStub, ProjectConfigStub, ProjectStub } from '@dungeonmaster/shared/contracts';

import { projectListBroker } from './project-list-broker';
import { projectListBrokerProxy } from './project-list-broker.proxy';

type ListProxy = ReturnType<typeof projectListBrokerProxy>;
type SetupParams = Parameters<ListProxy['setupProjectList']>[0];
type QuestDirEntries = SetupParams['projectEntries'][0]['questDirEntries'];

const createMockDirent = ({ isDir }: { isDir: boolean }): QuestDirEntries[0] =>
  ({
    isDirectory: jest.fn().mockReturnValue(isDir),
  }) as never;

describe('projectListBroker', () => {
  describe('successful list', () => {
    it('VALID: {single project, accessible, 2 quest dirs} => returns list item with valid true and questCount 2', async () => {
      const proxy = projectListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const project = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/projects/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      proxy.setupProjectList({
        config: ProjectConfigStub({ projects: [project] }),
        homeDir: '/home/user',
        homePath,
        projectEntries: [
          {
            accessible: true,
            questsDirPath,
            questDirEntries: [createMockDirent({ isDir: true }), createMockDirent({ isDir: true })],
          },
        ],
      });

      const result = await projectListBroker();

      expect(result).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'My App',
          path: '/home/user/my-app',
          createdAt: '2024-01-15T10:00:00.000Z',
          valid: true,
          questCount: 2,
        },
      ]);
    });

    it('VALID: {project not accessible} => returns list item with valid false', async () => {
      const proxy = projectListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const project = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Missing App',
        path: '/home/user/missing-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/projects/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      proxy.setupProjectList({
        config: ProjectConfigStub({ projects: [project] }),
        homeDir: '/home/user',
        homePath,
        projectEntries: [
          {
            accessible: false,
            questsDirPath,
            questDirEntries: [],
          },
        ],
      });

      const result = await projectListBroker();

      expect(result).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Missing App',
          path: '/home/user/missing-app',
          createdAt: '2024-01-15T10:00:00.000Z',
          valid: false,
          questCount: 0,
        },
      ]);
    });

    it('VALID: {multiple projects} => returns list items for each project', async () => {
      const proxy = projectListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const project1 = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'First App',
        path: '/home/user/first-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const project2 = ProjectStub({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Second App',
        path: '/home/user/second-app',
        createdAt: '2024-02-20T12:00:00.000Z',
      });
      const questsDirPath1 = FilePathStub({
        value: '/home/user/.dungeonmaster/projects/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });
      const questsDirPath2 = FilePathStub({
        value: '/home/user/.dungeonmaster/projects/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/quests',
      });

      proxy.setupProjectList({
        config: ProjectConfigStub({ projects: [project1, project2] }),
        homeDir: '/home/user',
        homePath,
        projectEntries: [
          {
            accessible: true,
            questsDirPath: questsDirPath1,
            questDirEntries: [createMockDirent({ isDir: true })],
          },
          {
            accessible: true,
            questsDirPath: questsDirPath2,
            questDirEntries: [
              createMockDirent({ isDir: true }),
              createMockDirent({ isDir: true }),
              createMockDirent({ isDir: true }),
            ],
          },
        ],
      });

      const result = await projectListBroker();

      expect(result).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'First App',
          path: '/home/user/first-app',
          createdAt: '2024-01-15T10:00:00.000Z',
          valid: true,
          questCount: 1,
        },
        {
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          name: 'Second App',
          path: '/home/user/second-app',
          createdAt: '2024-02-20T12:00:00.000Z',
          valid: true,
          questCount: 3,
        },
      ]);
    });

    it('VALID: {entries with non-directory files} => counts only directories as quests', async () => {
      const proxy = projectListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const project = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/projects/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      proxy.setupProjectList({
        config: ProjectConfigStub({ projects: [project] }),
        homeDir: '/home/user',
        homePath,
        projectEntries: [
          {
            accessible: true,
            questsDirPath,
            questDirEntries: [
              createMockDirent({ isDir: true }),
              createMockDirent({ isDir: false }),
              createMockDirent({ isDir: true }),
            ],
          },
        ],
      });

      const result = await projectListBroker();

      expect(result).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'My App',
          path: '/home/user/my-app',
          createdAt: '2024-01-15T10:00:00.000Z',
          valid: true,
          questCount: 2,
        },
      ]);
    });
  });

  describe('empty config', () => {
    it('EMPTY: {no projects in config} => returns empty array', async () => {
      const proxy = projectListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });

      proxy.setupEmptyConfig({ homeDir: '/home/user', homePath });

      const result = await projectListBroker();

      expect(result).toStrictEqual([]);
    });
  });
});
