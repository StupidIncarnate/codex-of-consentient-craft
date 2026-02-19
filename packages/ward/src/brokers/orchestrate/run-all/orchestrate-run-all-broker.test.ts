import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';
import { CheckResultStub } from '../../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { WardResultStub } from '../../../contracts/ward-result/ward-result.stub';

import { orchestrateRunAllBroker } from './orchestrate-run-all-broker';
import { orchestrateRunAllBrokerProxy } from './orchestrate-run-all-broker.proxy';

describe('orchestrateRunAllBroker', () => {
  describe('default run', () => {
    it('VALID: {no filters, two projects} => discovers projects, runs all checks, returns WardResult', async () => {
      const proxy = orchestrateRunAllBrokerProxy();
      proxy.setupDefaultRun({
        gitOutput: 'packages/ward/package.json\npackages/shared/package.json\n',
        packageContents: [
          JSON.stringify({ name: '@dungeonmaster/ward' }),
          JSON.stringify({ name: '@dungeonmaster/shared' }),
        ],
        checkCount: 2,
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub();

      const result = await orchestrateRunAllBroker({ config, rootPath, });

      const wardFolder = ProjectFolderStub({
        name: '@dungeonmaster/ward',
        path: '/project/packages/ward',
      });
      const sharedFolder = ProjectFolderStub({
        name: '@dungeonmaster/shared',
        path: '/project/packages/shared',
      });

      expect(result).toStrictEqual(
        WardResultStub({
          runId: '1739625600000-a38e',
          checks: [
            CheckResultStub({
              checkType: 'lint',
              status: 'pass',
              projectResults: [
                ProjectResultStub({
                  projectFolder: wardFolder,
                  rawOutput: RawOutputStub(),
                }),
                ProjectResultStub({
                  projectFolder: sharedFolder,
                  rawOutput: RawOutputStub(),
                }),
              ],
            }),
            CheckResultStub({
              checkType: 'typecheck',
              status: 'pass',
              projectResults: [
                ProjectResultStub({ projectFolder: wardFolder }),
                ProjectResultStub({ projectFolder: sharedFolder }),
              ],
            }),
            CheckResultStub({
              checkType: 'test',
              status: 'pass',
              projectResults: [
                ProjectResultStub({
                  projectFolder: wardFolder,
                  rawOutput: RawOutputStub(),
                }),
                ProjectResultStub({
                  projectFolder: sharedFolder,
                  rawOutput: RawOutputStub(),
                }),
              ],
            }),
          ],
        }),
      );
    });
  });

  describe('sub-package run', () => {
    it('VALID: {cwd differs from rootPath} => runs per-project checks', async () => {
      const proxy = orchestrateRunAllBrokerProxy();
      proxy.setupSubPackageRun({
        gitOutput: 'packages/ward/package.json\n',
        packageContents: [JSON.stringify({ name: '@dungeonmaster/ward' })],
        checkCount: 1,
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub();

      const result = await orchestrateRunAllBroker({ config, rootPath, });

      const wardFolder = ProjectFolderStub({
        name: '@dungeonmaster/ward',
        path: '/project/packages/ward',
      });

      expect(result).toStrictEqual(
        WardResultStub({
          runId: '1739625600000-a38e',
          checks: [
            CheckResultStub({
              checkType: 'lint',
              status: 'pass',
              projectResults: [
                ProjectResultStub({
                  projectFolder: wardFolder,
                  rawOutput: RawOutputStub(),
                }),
              ],
            }),
            CheckResultStub({
              checkType: 'typecheck',
              status: 'pass',
              projectResults: [ProjectResultStub({ projectFolder: wardFolder })],
            }),
            CheckResultStub({
              checkType: 'test',
              status: 'pass',
              projectResults: [
                ProjectResultStub({
                  projectFolder: wardFolder,
                  rawOutput: RawOutputStub(),
                }),
              ],
            }),
          ],
        }),
      );
    });
  });

  describe('run with passthrough files', () => {
    it('VALID: {passthrough files, two projects} => only runs checks in matching project', async () => {
      const proxy = orchestrateRunAllBrokerProxy();
      proxy.setupWithPassthrough({
        gitOutput: 'packages/ward/package.json\npackages/shared/package.json\n',
        packageContents: [
          JSON.stringify({ name: '@dungeonmaster/ward' }),
          JSON.stringify({ name: '@dungeonmaster/shared' }),
        ],
        checkCount: 1,
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({
        only: ['test'],
        passthrough: ['packages/ward/src/index.test.ts'],
      });

      const result = await orchestrateRunAllBroker({ config, rootPath, });

      const wardFolder = ProjectFolderStub({
        name: '@dungeonmaster/ward',
        path: '/project/packages/ward',
      });

      expect(result).toStrictEqual(
        WardResultStub({
          runId: '1739625600000-a38e',
          filters: {
            only: ['test'],
            passthrough: ['packages/ward/src/index.test.ts'],
          },
          checks: [
            CheckResultStub({
              checkType: 'test',
              status: 'pass',
              projectResults: [
                ProjectResultStub({
                  projectFolder: wardFolder,
                  rawOutput: RawOutputStub(),
                }),
              ],
            }),
          ],
        }),
      );

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        'jest',
        '--json',
        '--no-color',
        '--forceExit',
        '--detectOpenHandles',
        '--runInBand',
        '--findRelatedTests',
        'src/index.test.ts',
      ]);
    });
  });

  describe('no projects found', () => {
    it('EMPTY: {no projects discovered} => returns WardResult with empty project results', async () => {
      const proxy = orchestrateRunAllBrokerProxy();
      proxy.setupNoProjects();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub();

      const result = await orchestrateRunAllBroker({ config, rootPath, });

      expect(result).toStrictEqual(
        WardResultStub({
          runId: '1739625600000-a38e',
          checks: [
            CheckResultStub({ checkType: 'lint', status: 'pass', projectResults: [] }),
            CheckResultStub({ checkType: 'typecheck', status: 'pass', projectResults: [] }),
            CheckResultStub({ checkType: 'test', status: 'pass', projectResults: [] }),
          ],
        }),
      );
    });
  });
});
