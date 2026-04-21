import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { commandRunLayerMultiBroker } from './command-run-layer-multi-broker';
import { commandRunLayerMultiBrokerProxy } from './command-run-layer-multi-broker.proxy';

describe('commandRunLayerMultiBroker', () => {
  describe('spawns and merges', () => {
    it('VALID: {one package folder, sub-result loads successfully} => returns merged WardResult', async () => {
      const subResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/ward', path: '/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 5,
              },
            ],
          },
        ],
      });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoad({ packageCount: 1, subResultContent: subResult });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolders = [ProjectFolderStub()];
      const config = WardConfigStub({ only: ['lint'] });

      const result = await commandRunLayerMultiBroker({ config, projectFolders, rootPath });

      expect(result.checks).toStrictEqual([
        {
          checkType: 'lint',
          status: 'pass',
          durationMs: 0,
          projectResults: [
            {
              projectFolder: { name: '@dungeonmaster/ward', path: '/project/packages/ward' },
              status: 'pass',
              errors: [],
              testFailures: [],
              filesCount: 5,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: { stdout: '', stderr: '', exitCode: 0 },
              fileTimings: [],
              passingTests: [],
            },
          ],
        },
      ]);
    });
  });

  describe('null sub-result', () => {
    it('VALID: {one package, storage load returns null} => skips package and returns empty checks', async () => {
      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnWithNullLoad();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolders = [ProjectFolderStub()];
      const config = WardConfigStub({ only: ['lint'] });

      const result = await commandRunLayerMultiBroker({ config, projectFolders, rootPath });

      expect(result.checks).toStrictEqual([
        {
          checkType: 'lint',
          status: 'pass',
          durationMs: 0,
          projectResults: [],
        },
      ]);
    });
  });

  describe('progress output', () => {
    it('VALID: {one package, lint passes} => no duplicate progress lines from parent', async () => {
      const subResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/ward', path: '/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 5,
              },
            ],
          },
        ],
      });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoad({ packageCount: 1, subResultContent: subResult });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolders = [ProjectFolderStub()];
      const config = WardConfigStub({ only: ['lint'] });

      await commandRunLayerMultiBroker({ config, projectFolders, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([]);
    });
  });

  describe('passthrough filtering', () => {
    it('VALID: {2 packages, passthrough files for only 1} => only 1 child spawned', async () => {
      const subResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/ward',
                  path: '/home/user/project/packages/ward',
                },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 5,
              },
            ],
          },
        ],
      });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({ packages: [{ subResultContent: subResult }] });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });
      const config = WardConfigStub({
        only: ['lint'],
        passthrough: ['packages/ward/src/foo.test.ts'],
      });

      await commandRunLayerMultiBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        ['run', '--only', 'lint', '--', 'src/foo.test.ts'],
      ]);
    });

    it('VALID: {2 packages, passthrough files for both} => both children spawned with respective filtered files', async () => {
      const wardSubResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/ward',
                  path: '/home/user/project/packages/ward',
                },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 5,
              },
            ],
          },
        ],
      });
      const hooksSubResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/hooks',
                  path: '/home/user/project/packages/hooks',
                },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 3,
              },
            ],
          },
        ],
      });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        packages: [{ subResultContent: wardSubResult }, { subResultContent: hooksSubResult }],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });
      const config = WardConfigStub({
        only: ['lint'],
        passthrough: ['packages/ward/src/foo.test.ts', 'packages/hooks/src/bar.test.ts'],
      });

      await commandRunLayerMultiBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        ['run', '--only', 'lint', '--', 'src/foo.test.ts'],
        ['run', '--only', 'lint', '--', 'src/bar.test.ts'],
      ]);
    });

    it('EMPTY: {passthrough active but no files match any package} => no children spawned', async () => {
      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupNoSpawns();

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });
      const config = WardConfigStub({
        only: ['lint'],
        passthrough: ['packages/other/src/baz.test.ts'],
      });

      const result = await commandRunLayerMultiBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([]);
      expect(result.checks).toStrictEqual([
        {
          checkType: 'lint',
          status: 'pass',
          durationMs: 0,
          projectResults: [],
        },
      ]);
    });

    it('VALID: {passthrough is bare package path} => child spawned with no file scope', async () => {
      const subResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/hooks',
                  path: '/home/user/project/packages/hooks',
                },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 10,
              },
            ],
          },
        ],
      });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({ packages: [{ subResultContent: subResult }] });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });
      const config = WardConfigStub({
        only: ['lint'],
        passthrough: ['packages/hooks'],
      });

      await commandRunLayerMultiBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([['run', '--only', 'lint']]);
    });

    it('VALID: {mixed package path and file path for different packages} => package gets no file scope, file package gets file scope', async () => {
      const wardSubResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/ward',
                  path: '/home/user/project/packages/ward',
                },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 5,
              },
            ],
          },
        ],
      });
      const hooksSubResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/hooks',
                  path: '/home/user/project/packages/hooks',
                },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 10,
              },
            ],
          },
        ],
      });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        packages: [{ subResultContent: hooksSubResult }, { subResultContent: wardSubResult }],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const config = WardConfigStub({
        only: ['lint'],
        passthrough: ['packages/hooks', 'packages/ward/src/foo.test.ts'],
      });

      await commandRunLayerMultiBroker({
        config,
        projectFolders: [hooksFolder, wardFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        ['run', '--only', 'lint'],
        ['run', '--only', 'lint', '--', 'src/foo.test.ts'],
      ]);
    });

    it('VALID: {no passthrough, 2 packages} => all packages spawned as before', async () => {
      const wardSubResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/ward',
                  path: '/home/user/project/packages/ward',
                },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 5,
              },
            ],
          },
        ],
      });
      const hooksSubResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: {
                  name: '@dungeonmaster/hooks',
                  path: '/home/user/project/packages/hooks',
                },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 3,
              },
            ],
          },
        ],
      });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        packages: [{ subResultContent: wardSubResult }, { subResultContent: hooksSubResult }],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });
      const config = WardConfigStub({ only: ['lint'] });

      await commandRunLayerMultiBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        ['run', '--only', 'lint'],
        ['run', '--only', 'lint'],
      ]);
    });
  });
});
