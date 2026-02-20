import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { commandRunLayerSingleBroker } from './command-run-layer-single-broker';
import { commandRunLayerSingleBrokerProxy } from './command-run-layer-single-broker.proxy';

describe('commandRunLayerSingleBroker', () => {
  describe('all checks pass', () => {
    it('VALID: {all checks pass, no fileList} => returns WardResult with pass checks', async () => {
      const proxy = commandRunLayerSingleBrokerProxy();
      proxy.setupAllChecksPass();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub();

      const result = await commandRunLayerSingleBroker({ config, projectFolder, rootPath });

      expect(result.checks.every((c) => c.status === 'pass')).toBe(true);
      expect(result.runId).toBe('1739625600000-a38e');
    });
  });

  describe('progress output', () => {
    it('VALID: {lint passes} => writes running then PASS to stderr', async () => {
      const proxy = commandRunLayerSingleBrokerProxy();
      proxy.setupLintOnlyPass();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });

      await commandRunLayerSingleBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'lint        ward                 running...\r',
        '\x1b[Klint        ward                 PASS  0 files\n',
      ]);
    });

    it('VALID: {lint fails with errors} => writes FAIL with error count to stderr', async () => {
      const proxy = commandRunLayerSingleBrokerProxy();
      proxy.setupLintOnlyFail({
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
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['lint'] });

      await commandRunLayerSingleBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'lint        ward                 running...\r',
        '\x1b[Klint        ward                 FAIL  1 files, 1 errors\n',
      ]);
    });

    it('VALID: {e2e skips, no playwright config} => clears running line without result output', async () => {
      const proxy = commandRunLayerSingleBrokerProxy();
      proxy.setupE2eOnlySkip();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolder = ProjectFolderStub();
      const config = WardConfigStub({ only: ['e2e'] });

      await commandRunLayerSingleBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'e2e         ward                 running...\r',
        '\x1b[K',
      ]);
    });
  });
});
