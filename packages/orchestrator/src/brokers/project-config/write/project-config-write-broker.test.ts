import { FilePathStub, ProjectConfigStub, ProjectStub } from '@dungeonmaster/shared/contracts';

import { projectConfigWriteBroker } from './project-config-write-broker';
import { projectConfigWriteBrokerProxy } from './project-config-write-broker.proxy';

describe('projectConfigWriteBroker', () => {
  describe('successful write', () => {
    it('VALID: {config with projects} => writes pretty-printed JSON', async () => {
      const proxy = projectConfigWriteBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const project = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Project',
        path: '/home/user/my-project',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const config = ProjectConfigStub({ projects: [project] });

      proxy.setupWriteSuccess({
        homeDir: '/home/user',
        homePath,
        configFilePath,
      });

      await projectConfigWriteBroker({ config });

      const writtenContent = proxy.getWrittenContent();

      expect(writtenContent).toBe(JSON.stringify(config, null, 2));
    });

    it('VALID: {config with empty projects} => writes JSON with empty array', async () => {
      const proxy = projectConfigWriteBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const config = ProjectConfigStub({ projects: [] });

      proxy.setupWriteSuccess({
        homeDir: '/home/user',
        homePath,
        configFilePath,
      });

      await projectConfigWriteBroker({ config });

      const writtenContent = proxy.getWrittenContent();

      expect(writtenContent).toBe(JSON.stringify({ projects: [] }, null, 2));
    });
  });

  describe('write errors', () => {
    it('ERROR: {write failure} => throws error', async () => {
      const proxy = projectConfigWriteBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const config = ProjectConfigStub({ projects: [] });

      proxy.setupWriteFailure({
        homeDir: '/home/user',
        homePath,
        configFilePath,
        error: new Error('EACCES: permission denied'),
      });

      await expect(projectConfigWriteBroker({ config })).rejects.toThrow(
        /EACCES: permission denied/u,
      );
    });
  });
});
