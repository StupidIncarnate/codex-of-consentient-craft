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

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolders = [ProjectFolderStub()];
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoad({ rootPath, projectFolders, subResultContent: subResult });

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
    it('VALID: {one package, storage load returns null} => reports the package as crashed', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnWithNullLoad({ rootPath, projectFolder });

      const result = await commandRunLayerMultiBroker({
        config,
        projectFolders: [projectFolder],
        rootPath,
      });

      expect(result.checks).toStrictEqual([
        {
          checkType: 'lint',
          status: 'fail',
          durationMs: 0,
          projectResults: [
            {
              projectFolder: {
                name: 'ward',
                path: '/home/user/project/packages/ward',
              },
              status: 'fail',
              errors: [],
              testFailures: [],
              filesCount: 0,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: {
                stdout: 'run: 1739625600000-a38e  (1.2s)\n',
                stderr:
                  'ward child process for ward exited with code 1 and wrote no readable result file',
                exitCode: 1,
              },
              fileTimings: [],
              passingTests: [],
            },
          ],
        },
      ]);
    });
  });

  describe('child that printed no run id', () => {
    it('ERROR: {child dies before its summary line, package has an older saved result} => reports the crash, not the previous run', async () => {
      // What a child ward prints when it dies at CLI-parse time: its own error on stderr, and on
      // stdout nothing at all. `.ward/run-1739000000000-01de.json` below is a REAL result from an
      // earlier run of this package — the newest file in the directory, and a clean pass.
      const staleResult = JSON.stringify({
        runId: '1739000000000-01de',
        timestamp: 1739000000000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 163,
              },
            ],
          },
        ],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupCrashedChildOverStaleResult({
        rootPath,
        projectFolder,
        childStdout: '',
        staleResultContent: staleResult,
      });

      const result = await commandRunLayerMultiBroker({
        config,
        projectFolders: [projectFolder],
        rootPath,
      });

      expect(result.checks).toStrictEqual([
        {
          checkType: 'lint',
          status: 'fail',
          durationMs: 0,
          projectResults: [
            {
              projectFolder: {
                name: 'ward',
                path: '/home/user/project/packages/ward',
              },
              status: 'fail',
              errors: [],
              testFailures: [],
              filesCount: 0,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: {
                stdout: '',
                stderr:
                  'ward child process for ward exited with code 1 and wrote no readable result file',
                exitCode: 1,
              },
              fileTimings: [],
              passingTests: [],
            },
          ],
        },
      ]);
    });

    it('ERROR: {child prints output but no run line, package has an older saved result} => carries the child output into the crash result', async () => {
      const staleResult = JSON.stringify({
        runId: '1739000000000-01de',
        timestamp: 1739000000000,
        filters: {},
        checks: [
          {
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 163,
              },
            ],
          },
        ],
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['unit'] });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupCrashedChildOverStaleResult({
        rootPath,
        projectFolder,
        childStdout: 'FATAL ERROR: JavaScript heap out of memory\n',
        staleResultContent: staleResult,
      });

      const result = await commandRunLayerMultiBroker({
        config,
        projectFolders: [projectFolder],
        rootPath,
      });

      expect(result.checks).toStrictEqual([
        {
          checkType: 'unit',
          status: 'fail',
          durationMs: 0,
          projectResults: [
            {
              projectFolder: {
                name: 'ward',
                path: '/home/user/project/packages/ward',
              },
              status: 'fail',
              errors: [],
              testFailures: [],
              filesCount: 0,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: {
                stdout: 'FATAL ERROR: JavaScript heap out of memory\n',
                stderr:
                  'ward child process for ward exited with code 1 and wrote no readable result file',
                exitCode: 1,
              },
              fileTimings: [],
              passingTests: [],
            },
          ],
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

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolders = [ProjectFolderStub()];
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoad({ rootPath, projectFolders, subResultContent: subResult });

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

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: subResult }],
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

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
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

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupNoSpawns({ rootPath });

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

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: hooksFolder, subResultContent: subResult }],
      });

      await commandRunLayerMultiBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([['run', '--only', 'lint']]);
    });

    it('VALID: {passthrough is bare package path with --onlyTests} => child is told the parent already scoped it', async () => {
      const subResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'unit',
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
                filesCount: 1,
              },
            ],
          },
        ],
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
        only: ['unit'],
        onlyTests: 'my test',
        passthrough: ['packages/ward'],
      });

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: subResult }],
      });

      await commandRunLayerMultiBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      // A whole-package arg leaves no per-file list to forward, so the child would face the same
      // `--onlyTests` without a `-- <files>` scope the parser rejects. The marker says the parent
      // already narrowed the run to this one package.
      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        ['run', '--only', 'unit', '--onlyTests', 'my test', '--parentScoped'],
      ]);
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

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
          { projectFolder: wardFolder, subResultContent: wardSubResult },
        ],
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

      const proxy = commandRunLayerMultiBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });

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
