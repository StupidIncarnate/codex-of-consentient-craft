import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { NodeVersionUnsupportedError } from '#gateway/node/sqlite';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';
import { DurationSampleStub } from '../../../contracts/duration-sample/duration-sample.stub';

import { multiPackageLayerBroker } from './multi-package-layer-broker';
import { multiPackageLayerBrokerProxy } from './multi-package-layer-broker.proxy';

describe('multiPackageLayerBroker', () => {
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

      const rootPath = '/project';
      const projectFolders = [ProjectFolderStub()];
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({ rootPath, projectFolders, subResultContent: subResult });

      const result = await multiPackageLayerBroker({ config, projectFolders, rootPath });

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
              elsewhereErrors: [],
              testFailures: [],
              filesCount: 5,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: { stdout: '', stderr: '', exitCode: 0, signal: null },
              fileTimings: [],
              passingTests: [],
              openHandles: [],
              durationMs: 0,
            },
          ],
        },
      ]);
    });
  });

  describe('null sub-result', () => {
    it('VALID: {one package, storage load returns null} => reports the package as crashed', async () => {
      const rootPath = '/project';
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnWithNullLoad({ rootPath, projectFolder });

      const result = await multiPackageLayerBroker({
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
              elsewhereErrors: [],
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
                signal: null,
              },
              fileTimings: [],
              passingTests: [],
              openHandles: [],
              durationMs: 0,
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

      const rootPath = '/project';
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupCrashedChildOverStaleResult({
        rootPath,
        projectFolder,
        childStdout: '',
        staleResultContent: staleResult,
      });

      const result = await multiPackageLayerBroker({
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
              elsewhereErrors: [],
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
                signal: null,
              },
              fileTimings: [],
              passingTests: [],
              openHandles: [],
              durationMs: 0,
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

      const rootPath = '/project';
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['unit'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupCrashedChildOverStaleResult({
        rootPath,
        projectFolder,
        childStdout: 'FATAL ERROR: JavaScript heap out of memory\n',
        staleResultContent: staleResult,
      });

      const result = await multiPackageLayerBroker({
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
              elsewhereErrors: [],
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
                signal: null,
              },
              fileTimings: [],
              passingTests: [],
              openHandles: [],
              durationMs: 0,
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

      const rootPath = '/project';
      const projectFolders = [ProjectFolderStub()];
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({ rootPath, projectFolders, subResultContent: subResult });

      await multiPackageLayerBroker({ config, projectFolders, rootPath });

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

      const rootPath = '/home/user/project';
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

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: subResult }],
      });

      await multiPackageLayerBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint', '--', 'src/foo.test.ts'],
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

      const rootPath = '/home/user/project';
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

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });

      await multiPackageLayerBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint', '--', 'src/foo.test.ts'],
        [proxy.wardEntry, 'run', '--jestWorkers', '50', '--only', 'lint', '--', 'src/bar.test.ts'],
      ]);
    });

    it('EMPTY: {passthrough active but no files match any package} => no children spawned', async () => {
      const rootPath = '/home/user/project';
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

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupNoSpawns({ rootPath });

      const result = await multiPackageLayerBroker({
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

      const rootPath = '/home/user/project';
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

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: hooksFolder, subResultContent: subResult }],
      });

      await multiPackageLayerBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint'],
      ]);
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

      const rootPath = '/home/user/project';
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

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: subResult }],
      });

      await multiPackageLayerBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      // A whole-package arg leaves no per-file list to forward, so the child would face the same
      // `--onlyTests` without a `-- <files>` scope the parser rejects. The marker says the parent
      // already narrowed the run to this one package.
      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          proxy.wardEntry,
          'run',
          '--jestWorkers',
          '100',
          '--only',
          'unit',
          '--onlyTests',
          'my test',
          '--parentScoped',
        ],
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

      const rootPath = '/home/user/project';
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

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
          { projectFolder: wardFolder, subResultContent: wardSubResult },
        ],
      });

      await multiPackageLayerBroker({
        config,
        projectFolders: [hooksFolder, wardFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint'],
        [proxy.wardEntry, 'run', '--jestWorkers', '50', '--only', 'lint', '--', 'src/foo.test.ts'],
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

      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });

      await multiPackageLayerBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint'],
        [proxy.wardEntry, 'run', '--jestWorkers', '50', '--only', 'lint'],
      ]);
    });
  });

  describe('ward concurrency config', () => {
    it('VALID: {2 packages} => resolves the ward config exactly once, not once per package', async () => {
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

      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });

      const result = await multiPackageLayerBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      // Only the root package.json address is staged. A per-folder read would hit an unstaged
      // address and never resolve a config, so both folders grading through proves the one read.
      expect(result.checks[0]?.projectResults.map((r) => r.projectFolder.name)).toStrictEqual([
        '@dungeonmaster/ward',
        '@dungeonmaster/hooks',
      ]);
    });

    it('VALID: {.dungeonmaster.json sets ward.concurrency} => run still succeeds using the configured value', async () => {
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

      const rootPath = '/project';
      const projectFolders = [ProjectFolderStub()];
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({ rootPath, projectFolders, subResultContent: subResult });
      proxy.setupWardConcurrency({ rootPath, concurrency: 1 });

      const result = await multiPackageLayerBroker({ config, projectFolders, rootPath });

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
              elsewhereErrors: [],
              testFailures: [],
              filesCount: 5,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: { stdout: '', stderr: '', exitCode: 0, signal: null },
              fileTimings: [],
              passingTests: [],
              openHandles: [],
              durationMs: 0,
            },
          ],
        },
      ]);
    });
  });

  describe('per-package durations', () => {
    it('VALID: {2 packages, children report different check durations} => each project result keeps its own child duration, check duration stays the slowest', async () => {
      const wardSubResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            durationMs: 4200,
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
            durationMs: 900,
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

      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });

      const result = await multiPackageLayerBroker({
        config,
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(result.checks).toStrictEqual([
        {
          checkType: 'lint',
          status: 'pass',
          // Still the wall clock for the WHOLE check — the slowest child, not a stand-in copied
          // onto every package.
          durationMs: 4200,
          projectResults: [
            {
              projectFolder: {
                name: '@dungeonmaster/ward',
                path: '/home/user/project/packages/ward',
              },
              status: 'pass',
              errors: [],
              elsewhereErrors: [],
              testFailures: [],
              filesCount: 5,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: { stdout: '', stderr: '', exitCode: 0, signal: null },
              fileTimings: [],
              passingTests: [],
              openHandles: [],
              durationMs: 4200,
            },
            {
              projectFolder: {
                name: '@dungeonmaster/hooks',
                path: '/home/user/project/packages/hooks',
              },
              status: 'pass',
              errors: [],
              elsewhereErrors: [],
              testFailures: [],
              filesCount: 3,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: { stdout: '', stderr: '', exitCode: 0, signal: null },
              fileTimings: [],
              passingTests: [],
              openHandles: [],
              durationMs: 900,
            },
          ],
        },
      ]);
    });
  });

  describe('the filters it records on the merged result', () => {
    const passingSubResult = JSON.stringify({
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

    // `passthrough` CANNOT SPEAK FOR ITSELF. `gitScopeLayerBroker` writes a `--committed` /
    // `--uncommitted` diff into that same field, so a saved result carrying the list alone reads
    // back as a list the caller typed — and `isCallerFileScopeGuard`, which the summary and the
    // detail both narrow on, would then print a whole unbounded diff's failures in full and drop a
    // `not run` section that was the real finding.
    it('VALID: {uncommitted run} => records the uncommitted flag beside the resolved paths', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: passingSubResult }],
      });

      const result = await multiPackageLayerBroker({
        config: WardConfigStub({
          only: ['lint'],
          uncommitted: true,
          passthrough: ['packages/ward/src/foo.test.ts'],
        }),
        projectFolders: [wardFolder],
        rootPath,
      });

      expect(result.filters).toStrictEqual({
        only: ['lint'],
        uncommitted: true,
        passthrough: ['packages/ward/src/foo.test.ts'],
      });
    });

    it('VALID: {committed run} => records the committed flag beside the resolved paths', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: passingSubResult }],
      });

      const result = await multiPackageLayerBroker({
        config: WardConfigStub({
          only: ['lint'],
          committed: true,
          passthrough: ['packages/ward/src/foo.test.ts'],
        }),
        projectFolders: [wardFolder],
        rootPath,
      });

      expect(result.filters).toStrictEqual({
        only: ['lint'],
        committed: true,
        passthrough: ['packages/ward/src/foo.test.ts'],
      });
    });

    it('VALID: {caller-typed file list} => records the paths and neither git flag', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: passingSubResult }],
      });

      const result = await multiPackageLayerBroker({
        config: WardConfigStub({
          only: ['lint'],
          passthrough: ['packages/ward/src/foo.test.ts'],
        }),
        projectFolders: [wardFolder],
        rootPath,
      });

      expect(result.filters).toStrictEqual({
        only: ['lint'],
        passthrough: ['packages/ward/src/foo.test.ts'],
      });
    });

    it('EMPTY: {no scope of any kind} => records only the check filter', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: passingSubResult }],
      });

      const result = await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder],
        rootPath,
      });

      expect(result.filters).toStrictEqual({ only: ['lint'] });
    });
  });

  describe('platformDedupeProjectResult', () => {
    it('VALID: {a failing platformDedupeProjectResult, every child package passes} => folds it into lint and flips the check to fail', async () => {
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

      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: subResult }],
      });
      const platformDedupeProjectResult = ProjectResultStub({
        projectFolder: { name: '(platform + dedupe)', path: '/home/user/project' },
        status: 'fail',
        errors: [
          {
            filePath: 'web',
            line: 0,
            column: 0,
            message: 'a platform crossing',
            severity: 'error',
          },
        ],
      });

      const result = await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder],
        rootPath,
        platformDedupeProjectResult,
      });

      const lintCheck = result.checks.find((check) => check.checkType === 'lint');

      expect(lintCheck?.status).toBe('fail');
      expect(lintCheck?.projectResults).toStrictEqual([
        {
          projectFolder: { name: '@dungeonmaster/ward', path: '/home/user/project/packages/ward' },
          status: 'pass',
          errors: [],
          elsewhereErrors: [],
          testFailures: [],
          filesCount: 5,
          discoveredCount: 0,
          onlyDiscovered: [],
          onlyProcessed: [],
          rawOutput: { stdout: '', stderr: '', exitCode: 0, signal: null },
          fileTimings: [],
          passingTests: [],
          openHandles: [],
          durationMs: 0,
        },
        platformDedupeProjectResult,
      ]);
    });
  });

  describe('the child command', () => {
    it('VALID: {parent started from a compiled entry script} => spawns each child as `<execPath> <that script> run ...`', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: '@dungeonmaster/ward',
        path: '/home/user/project/packages/ward',
      });
      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({
        rootPath,
        projectFolders: [wardFolder],
        subResultContent: JSON.stringify({
          runId: '1739625600000-a38e',
          timestamp: 1739625600000,
          filters: {},
          checks: [],
        }),
      });

      await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [
          '/home/user/project/packages/ward/dist/bin/ward-entry.js',
          'run',
          '--jestWorkers',
          '100',
          '--only',
          'lint',
        ],
      ]);
    });

    it('EDGE: {parent not started from a compiled entry script} => falls back to the dungeonmaster-ward bin by name', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: '@dungeonmaster/ward',
        path: '/home/user/project/packages/ward',
      });
      const proxy = multiPackageLayerBrokerProxy();
      proxy.useBinFallback();
      proxy.setupSpawnAndLoad({
        rootPath,
        projectFolders: [wardFolder],
        subResultContent: JSON.stringify({
          runId: '1739625600000-a38e',
          timestamp: 1739625600000,
          filters: {},
          checks: [],
        }),
      });

      await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        ['run', '--jestWorkers', '100', '--only', 'lint'],
      ]);
    });
  });

  describe('duration history and dispatch ordering', () => {
    it('VALID: {two packages, one with longer history} => spawns the package with longest history first in pool', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });

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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
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
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });
      proxy.setupDurationHistory({
        samples: [
          DurationSampleStub({
            repoRoot: rootPath,
            packageName: 'ward',
            checkType: 'lint',
            durationMs: 100,
          }),
          DurationSampleStub({
            repoRoot: rootPath,
            packageName: 'hooks',
            checkType: 'lint',
            durationMs: 900,
          }),
        ],
      });

      await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedCwds()).toStrictEqual([hooksFolder.path, wardFolder.path]);
    });

    it('VALID: {dispatch order differs from discovery order} => merged summary order matches discovery order', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });

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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
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
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });
      proxy.setupDurationHistory({
        samples: [
          DurationSampleStub({
            repoRoot: rootPath,
            packageName: 'ward',
            checkType: 'lint',
            durationMs: 100,
          }),
          DurationSampleStub({
            repoRoot: rootPath,
            packageName: 'hooks',
            checkType: 'lint',
            durationMs: 900,
          }),
        ],
      });

      const result = await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      const lintCheck = result.checks.find((check) => check.checkType === 'lint');

      expect(lintCheck?.projectResults.map((p) => p.projectFolder.name)).toStrictEqual([
        'ward',
        'hooks',
      ]);
    });

    it('VALID: {file-scoped run} => writes no duration sample', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [{ projectFolder: wardFolder, subResultContent: subResult }],
      });

      await multiPackageLayerBroker({
        config: WardConfigStub({
          only: ['lint'],
          passthrough: ['packages/ward/src/index.ts'],
        }),
        projectFolders: [wardFolder],
        rootPath,
      });

      expect(proxy.getWrittenDurationSamples()).toStrictEqual([]);
    });

    it('VALID: {onlyTests run} => writes no duration sample', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({
        rootPath,
        projectFolders: [wardFolder],
        subResultContent: subResult,
      });

      await multiPackageLayerBroker({
        config: WardConfigStub({
          only: ['unit'],
          onlyTests: 'my-test-name' as ReturnType<typeof WardConfigStub>['onlyTests'],
        }),
        projectFolders: [wardFolder],
        rootPath,
      });

      expect(proxy.getWrittenDurationSamples()).toStrictEqual([]);
    });

    it('VALID: {full run with multiple check types} => writes one sample per package and check type', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });

      const wardSubResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            durationMs: 120,
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
          {
            checkType: 'unit',
            status: 'pass',
            durationMs: 340,
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
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
            durationMs: 80,
            projectResults: [
              {
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
          {
            checkType: 'unit',
            status: 'pass',
            durationMs: 220,
            projectResults: [
              {
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });

      await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint', 'unit'] }),
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      const written = proxy.getWrittenDurationSamples();

      expect(written).toStrictEqual([
        {
          repoRoot: rootPath,
          packageName: 'ward',
          checkType: 'lint',
          durationMs: 120,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1739625600000,
        },
        {
          repoRoot: rootPath,
          packageName: 'hooks',
          checkType: 'lint',
          durationMs: 80,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1739625600000,
        },
        {
          repoRoot: rootPath,
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 340,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1739625600000,
        },
        {
          repoRoot: rootPath,
          packageName: 'hooks',
          checkType: 'unit',
          durationMs: 220,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1739625600000,
        },
      ]);
    });

    it('ERROR: {history write throws} => leaves result unchanged and prints one line to stderr', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({
        rootPath,
        projectFolders: [wardFolder],
        subResultContent: subResult,
      });
      proxy.setupDurationHistoryWriteThrows({
        error: NativeErrorStub({ message: 'sqlite database locked' }),
      });

      const result = await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder],
        rootPath,
      });

      expect(result.checks[0]?.status).toBe('pass');
      expect(proxy.getStderrCalls()).toStrictEqual([
        'ward: duration history unavailable: sqlite database locked\n',
      ]);
    });

    it('ERROR: {history read throws} => falls back to discovery order and prints one line to stderr', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });

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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
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
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });
      proxy.setupDurationHistoryThrows({
        error: NativeErrorStub({ message: 'sqlite table corrupt' }),
      });

      const result = await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(result.checks[0]?.status).toBe('pass');
      expect(proxy.getAllSpawnedCwds()).toStrictEqual([wardFolder.path, hooksFolder.path]);
      expect(proxy.getStderrCalls()).toStrictEqual([
        'ward: duration history unavailable: sqlite table corrupt\n',
        'ward: load balancing degraded: sqlite table corrupt\n',
      ]);
    });
  });

  describe('governor and machine load balancing', () => {
    it('VALID: {child process runs} => takes lease on spawn and releases on finish', async () => {
      const rootPath = '/project';
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });
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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({
        rootPath,
        projectFolders: [projectFolder],
        subResultContent: subResult,
      });

      await multiPackageLayerBroker({ config, projectFolders: [projectFolder], rootPath });

      expect(proxy.getActiveLeases()).toStrictEqual([]);

      const events = proxy.getLeaseAuditEvents();

      expect(
        events.map((event) => ({
          action: event.action,
          tool: event.tool,
          label: event.label,
          ownerPid: event.ownerPid,
          expectedPeakMB: event.expectedPeakMB,
        })),
      ).toStrictEqual([
        {
          action: 'insert',
          tool: 'ward',
          label: 'ward',
          ownerPid: 1234,
          expectedPeakMB: null,
        },
        {
          action: 'delete',
          tool: 'ward',
          label: 'ward',
          ownerPid: 1234,
          expectedPeakMB: null,
        },
      ]);
      expect(events[0]?.leaseId).toBe(events[1]?.leaseId);
    });

    it('VALID: {child crashes} => releases lease in finally', async () => {
      const rootPath = '/project';
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnWithNullLoad({ rootPath, projectFolder });

      const result = await multiPackageLayerBroker({
        config,
        projectFolders: [projectFolder],
        rootPath,
      });

      expect(result.checks[0]?.status).toBe('fail');
      expect(proxy.getActiveLeases()).toStrictEqual([]);

      const events = proxy.getLeaseAuditEvents();

      expect(
        events.map((event) => ({
          action: event.action,
          tool: event.tool,
          label: event.label,
          ownerPid: event.ownerPid,
          expectedPeakMB: event.expectedPeakMB,
        })),
      ).toStrictEqual([
        {
          action: 'insert',
          tool: 'ward',
          label: 'ward',
          ownerPid: 1234,
          expectedPeakMB: null,
        },
        {
          action: 'delete',
          tool: 'ward',
          label: 'ward',
          ownerPid: 1234,
          expectedPeakMB: null,
        },
      ]);
      expect(events[0]?.leaseId).toBe(events[1]?.leaseId);
    });

    it('VALID: {multiple concurrent packages} => calculates jestWorkers based on inFlightCount', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });

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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
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
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });

      await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint'],
        [proxy.wardEntry, 'run', '--jestWorkers', '50', '--only', 'lint'],
      ]);
    });

    it('VALID: {capacity suggestion is zero} => restricts pool concurrency to 1 and runs packages sequentially', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });

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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
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
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });
      proxy.setupCapacitySuggestion({ suggestion: 0, diskPath: rootPath });

      await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint'],
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint'],
      ]);
    });

    it('ERROR: {capacityReadBroker throws non-NodeVersionUnsupportedError} => falls back to limit 1 and prints warning once', async () => {
      const rootPath = '/home/user/project';
      const wardFolder = ProjectFolderStub({
        name: 'ward',
        path: '/home/user/project/packages/ward',
      });
      const hooksFolder = ProjectFolderStub({
        name: 'hooks',
        path: '/home/user/project/packages/hooks',
      });

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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
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
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoadSelective({
        rootPath,
        packages: [
          { projectFolder: wardFolder, subResultContent: wardSubResult },
          { projectFolder: hooksFolder, subResultContent: hooksSubResult },
        ],
      });
      proxy.setupCapacityReadThrows({
        error: NativeErrorStub({ message: 'capacity calculation failed' }),
      });

      await multiPackageLayerBroker({
        config: WardConfigStub({ only: ['lint'] }),
        projectFolders: [wardFolder, hooksFolder],
        rootPath,
      });

      expect(proxy.getAllSpawnedArgs()).toStrictEqual([
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint'],
        [proxy.wardEntry, 'run', '--jestWorkers', '100', '--only', 'lint'],
      ]);
      expect(proxy.getStderrCalls()).toStrictEqual([
        'ward: load balancing degraded: capacity calculation failed\n',
      ]);
    });

    it('ERROR: {capacityReadBroker throws NodeVersionUnsupportedError} => propagates error', async () => {
      const rootPath = '/project';
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupNoSpawns({ rootPath });
      proxy.setupCapacityReadThrows({
        error: new NodeVersionUnsupportedError({ runningVersion: '20.0.0' }),
      });

      await expect(
        multiPackageLayerBroker({
          config,
          projectFolders: [projectFolder],
          rootPath,
        }),
      ).rejects.toThrow(NodeVersionUnsupportedError);
    });

    it('VALID: {capacityReadBroker returns warnings} => prints each warning once to stderr', async () => {
      const rootPath = '/project';
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });
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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({
        rootPath,
        projectFolders: [projectFolder],
        subResultContent: subResult,
      });
      proxy.setupCapacityWarning({ warning: 'memory cap tight' });

      await multiPackageLayerBroker({ config, projectFolders: [projectFolder], rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'ward: load balancing degraded: memory cap tight\n',
      ]);
    });

    it('VALID: {memoryPeakSampleBroker measures peak} => records peak RSS on duration samples', async () => {
      const rootPath = '/project';
      const projectFolder = ProjectFolderStub({
        name: 'ward',
        path: '/project/packages/ward',
      });
      const config = WardConfigStub({ only: ['lint'] });
      const subResult = JSON.stringify({
        runId: '1739625600000-a38e',
        timestamp: 1739625600000,
        filters: {},
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            durationMs: 120,
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
                durationMs: 120,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({
        rootPath,
        projectFolders: [projectFolder],
        subResultContent: subResult,
      });
      proxy.setupMemoryPeak({ peakMB: 512 });

      await multiPackageLayerBroker({ config, projectFolders: [projectFolder], rootPath });

      expect(proxy.getWrittenDurationSamples()).toStrictEqual([
        {
          repoRoot: rootPath,
          packageName: 'ward',
          checkType: 'lint',
          durationMs: 120,
          peakRssMB: 512,
          shards: null,
          recordedAtMs: 1739625600000,
        },
      ]);
    });

    it('ERROR: {leaseTakeBroker throws} => sets degraded and prints warning once', async () => {
      const rootPath = '/project';
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });
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
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 1,
              },
            ],
          },
        ],
      });

      const proxy = multiPackageLayerBrokerProxy();
      proxy.setupSpawnAndLoad({
        rootPath,
        projectFolders: [projectFolder],
        subResultContent: subResult,
      });
      proxy.setupLeaseTakeThrows({ message: 'sqlite busy' });

      await multiPackageLayerBroker({ config, projectFolders: [projectFolder], rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'ward: load balancing degraded: Error: sqlite busy\n',
      ]);
    });
  });
});
