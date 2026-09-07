import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { singlePackageLayerBroker } from './single-package-layer-broker';
import { singlePackageLayerBrokerProxy } from './single-package-layer-broker.proxy';

describe('singlePackageLayerBroker', () => {
  describe('all checks pass', () => {
    it('VALID: {all checks pass, no fileList} => returns WardResult with pass checks', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupAllChecksPass({ projectFolder });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub();

      const result = await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(result.checks.every((c) => c.status === 'pass')).toBe(true);
      expect(result.runId).toBe('1739625600000-a38e');
    });
  });

  describe('progress output', () => {
    it('VALID: {lint passes} => writes running then PASS to stderr', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyPass({ projectFolder });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ only: ['lint'] });

      await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'lint        ward                 running...\r',
        '\x1b[Klint        ward                 PASS  0 files, 0 discovered (0.0s)\n',
      ]);
    });

    it('VALID: {lint fails with errors} => writes FAIL with error count to stderr', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyFail({
        projectFolder,
        stdout: JSON.stringify([
          {
            filePath: '/home/user/project/packages/ward/src/index.ts',
            messages: [
              { ruleId: 'no-unused-vars', message: 'x is unused', line: 1, column: 1, severity: 2 },
            ],
            errorCount: 1,
            warningCount: 0,
          },
        ]),
      });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ only: ['lint'] });

      await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'lint        ward                 running...\r',
        '\x1b[Klint        ward                 FAIL  1 files, 1 errors, 1 discovered (0.0s)\n',
      ]);
    });

    it('VALID: {e2e skips, package not e2e-eligible} => shows skip label on stderr', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupE2eOnlySkip({ projectFolder });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const config = WardConfigStub({ only: ['e2e'] });

      await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'e2e         ward                 running...\r',
        '\x1b[Ke2e         ward                 skip (0.0s)\n',
      ]);
    });
  });
});
