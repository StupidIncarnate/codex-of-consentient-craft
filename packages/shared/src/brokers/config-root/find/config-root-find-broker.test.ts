import { configRootFindBroker } from './config-root-find-broker';
import { configRootFindBrokerProxy } from './config-root-find-broker.proxy';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('configRootFindBroker', () => {
  describe('config root found', () => {
    it('VALID: {startPath: "/project"} => finds .dungeonmaster in startPath directory', async () => {
      const proxy = configRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project' });

      proxy.setupConfigRootFound({
        startPath: '/project',
        configRootPath: '/project',
      });

      const result = await configRootFindBroker({ startPath });

      expect(result).toBe('/project');
    });

    it('VALID: {startPath: "/monorepo/packages/web"} => finds .dungeonmaster in parent directory', async () => {
      const proxy = configRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/monorepo/packages/web' });

      proxy.setupConfigRootFoundInParent({
        startPath: '/monorepo/packages/web',
        configRootPath: '/monorepo',
      });

      const result = await configRootFindBroker({ startPath });

      expect(result).toBe('/monorepo');
    });
  });

  describe('config root not found', () => {
    it('ERROR: {startPath: "/no-config"} => throws ProjectRootNotFoundError', async () => {
      const proxy = configRootFindBrokerProxy();
      const startPath = FilePathStub({ value: '/no-config' });

      proxy.setupConfigRootNotFound({ startPath: '/no-config' });

      await expect(configRootFindBroker({ startPath })).rejects.toThrow(ProjectRootNotFoundError);
    });
  });
});
