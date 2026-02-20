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

      expect(result.checks).toHaveLength(1);
      expect(result.checks[0]?.checkType).toBe('lint');
      expect(result.checks[0]?.status).toBe('pass');
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
});
