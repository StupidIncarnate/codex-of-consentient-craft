import { FilePathStub, ProjectConfigStub, ProjectStub } from '@dungeonmaster/shared/contracts';

import { projectConfigReadBroker } from './project-config-read-broker';
import { projectConfigReadBrokerProxy } from './project-config-read-broker.proxy';

describe('projectConfigReadBroker', () => {
  describe('existing config', () => {
    it('VALID: {config.json exists with projects} => returns parsed ProjectConfig', async () => {
      const proxy = projectConfigReadBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const project = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Project',
        path: '/home/user/my-project',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const config = ProjectConfigStub({ projects: [project] });
      const configJson = JSON.stringify(config);

      proxy.setupConfigExists({
        homeDir: '/home/user',
        homePath,
        configFilePath,
        configJson,
      });

      const result = await projectConfigReadBroker();

      expect(result).toStrictEqual({
        projects: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'My Project',
            path: '/home/user/my-project',
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ],
      });
    });

    it('VALID: {config.json exists with empty projects} => returns config with empty array', async () => {
      const proxy = projectConfigReadBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const configJson = JSON.stringify({ projects: [] });

      proxy.setupConfigExists({
        homeDir: '/home/user',
        homePath,
        configFilePath,
        configJson,
      });

      const result = await projectConfigReadBroker();

      expect(result).toStrictEqual({
        projects: [],
      });
    });
  });

  describe('missing config', () => {
    it('EMPTY: {config.json does not exist} => returns default config with empty projects', async () => {
      const proxy = projectConfigReadBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });

      proxy.setupConfigMissing({
        homeDir: '/home/user',
        homePath,
        configFilePath,
      });

      const result = await projectConfigReadBroker();

      expect(result).toStrictEqual({
        projects: [],
      });
    });
  });

  describe('read errors', () => {
    it('ERROR: {non-ENOENT read failure} => throws error', async () => {
      const proxy = projectConfigReadBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });

      proxy.setupReadError({
        homeDir: '/home/user',
        homePath,
        configFilePath,
        error: new Error('Permission denied'),
      });

      await expect(projectConfigReadBroker()).rejects.toThrow(/Failed to read file/u);
    });
  });
});
