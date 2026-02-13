import {
  FilePathStub,
  ProjectConfigStub,
  ProjectNameStub,
  ProjectPathStub,
  ProjectStub,
} from '@dungeonmaster/shared/contracts';

import { projectAddBroker } from './project-add-broker';
import { projectAddBrokerProxy } from './project-add-broker.proxy';

describe('projectAddBroker', () => {
  describe('successful add', () => {
    it('VALID: {name, path, empty config} => returns new project with generated id and createdAt', async () => {
      const proxy = projectAddBrokerProxy();
      const name = ProjectNameStub({ value: 'My App' });
      const path = ProjectPathStub({ value: '/home/user/my-app' });
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const projectsPath = FilePathStub({ value: '/home/user/.dungeonmaster/projects' });
      const projectDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/projects/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/projects/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      proxy.setupAddProject({
        existingConfig: ProjectConfigStub({ projects: [] }),
        homeDir: '/home/user',
        homePath,
        projectsPath,
        projectDirPath,
        questsDirPath,
      });

      const result = await projectAddBroker({ name, path });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {name, path, config with existing projects} => returns new project alongside existing', async () => {
      const proxy = projectAddBrokerProxy();
      const name = ProjectNameStub({ value: 'Second App' });
      const path = ProjectPathStub({ value: '/home/user/second-app' });
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const projectsPath = FilePathStub({ value: '/home/user/.dungeonmaster/projects' });
      const projectDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/projects/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/projects/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      const existingProject = ProjectStub({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'First App',
        path: '/home/user/first-app',
      });

      proxy.setupAddProject({
        existingConfig: ProjectConfigStub({ projects: [existingProject] }),
        homeDir: '/home/user',
        homePath,
        projectsPath,
        projectDirPath,
        questsDirPath,
      });

      const result = await projectAddBroker({ name, path });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Second App',
        path: '/home/user/second-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('duplicate path', () => {
    it('ERROR: {path already exists in config} => throws duplicate path error', async () => {
      const proxy = projectAddBrokerProxy();
      const name = ProjectNameStub({ value: 'Duplicate App' });
      const path = ProjectPathStub({ value: '/home/user/my-app' });

      const existingProject = ProjectStub({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Existing App',
        path: '/home/user/my-app',
      });

      proxy.setupDuplicatePath({
        existingConfig: ProjectConfigStub({ projects: [existingProject] }),
      });

      await expect(projectAddBroker({ name, path })).rejects.toThrow(
        /A project with path \/home\/user\/my-app already exists/u,
      );
    });
  });
});
