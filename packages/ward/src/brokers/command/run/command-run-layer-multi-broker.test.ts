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
          projectResults: [
            {
              projectFolder: { name: '@dungeonmaster/ward', path: '/project/packages/ward' },
              status: 'pass',
              errors: [],
              testFailures: [],
              filesCount: 5,
              rawOutput: { stdout: '', stderr: '', exitCode: 0 },
            },
          ],
        },
      ]);
    });
  });

  describe('progress output', () => {
    it('VALID: {one package, lint passes} => writes PASS progress line to stderr', async () => {
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

      expect(proxy.getStderrCalls()).toStrictEqual([
        'lint        ward                 PASS  5 files\n',
      ]);
    });

    it('VALID: {one package, e2e skips} => does not write progress line for skipped check', async () => {
      const subResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'e2e',
            status: 'skip',
            projectResults: [
              {
                projectFolder: { name: '@dungeonmaster/ward', path: '/project/packages/ward' },
                status: 'skip',
                errors: [],
                testFailures: [],
                filesCount: 0,
                rawOutput: { stdout: '', stderr: 'no playwright.config.ts', exitCode: 0 },
              },
            ],
          },
        ],
      });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoad({ packageCount: 1, subResultContent: subResult });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolders = [ProjectFolderStub()];
      const config = WardConfigStub({ only: ['e2e'] });

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
                projectFolder: { name: '@dungeonmaster/ward', path: '/home/user/project/packages/ward' },
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
      const wardFolder = ProjectFolderStub({ name: 'ward', path: '/home/user/project/packages/ward' });
      const hooksFolder = ProjectFolderStub({ name: 'hooks', path: '/home/user/project/packages/hooks' });
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
        ['dungeonmaster-ward', 'run', '--only', 'lint', '--', 'packages/ward/src/foo.test.ts'],
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
                projectFolder: { name: '@dungeonmaster/ward', path: '/home/user/project/packages/ward' },
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
                projectFolder: { name: '@dungeonmaster/hooks', path: '/home/user/project/packages/hooks' },
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
        packages: [
          { subResultContent: wardSubResult },
          { subResultContent: hooksSubResult },
        ],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardFolder = ProjectFolderStub({ name: 'ward', path: '/home/user/project/packages/ward' });
      const hooksFolder = ProjectFolderStub({ name: 'hooks', path: '/home/user/project/packages/hooks' });
      const config = WardConfigStub({
        only: ['lint'],
        passthrough: [
          'packages/ward/src/foo.test.ts',
          'packages/hooks/src/bar.test.ts',
        ],
      });

      await commandRunLayerMultiBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        ['dungeonmaster-ward', 'run', '--only', 'lint', '--', 'packages/ward/src/foo.test.ts'],
        ['dungeonmaster-ward', 'run', '--only', 'lint', '--', 'packages/hooks/src/bar.test.ts'],
      ]);
    });

    it('EMPTY: {passthrough active but no files match any package} => no children spawned', async () => {
      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupNoSpawns();

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardFolder = ProjectFolderStub({ name: 'ward', path: '/home/user/project/packages/ward' });
      const hooksFolder = ProjectFolderStub({ name: 'hooks', path: '/home/user/project/packages/hooks' });
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
          projectResults: [],
        },
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
                projectFolder: { name: '@dungeonmaster/ward', path: '/home/user/project/packages/ward' },
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
                projectFolder: { name: '@dungeonmaster/hooks', path: '/home/user/project/packages/hooks' },
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
        packages: [
          { subResultContent: wardSubResult },
          { subResultContent: hooksSubResult },
        ],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardFolder = ProjectFolderStub({ name: 'ward', path: '/home/user/project/packages/ward' });
      const hooksFolder = ProjectFolderStub({ name: 'hooks', path: '/home/user/project/packages/hooks' });
      const config = WardConfigStub({ only: ['lint'] });

      await commandRunLayerMultiBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        ['dungeonmaster-ward', 'run', '--only', 'lint'],
        ['dungeonmaster-ward', 'run', '--only', 'lint'],
      ]);
    });
  });
});
