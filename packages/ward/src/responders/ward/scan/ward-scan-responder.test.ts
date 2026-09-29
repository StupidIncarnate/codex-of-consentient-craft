import { getExitCode, setExitCode } from '#gateway/node/process';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { WardScanResponderProxy } from './ward-scan-responder.proxy';

const rootPath = AbsoluteFilePathStub({ value: '/project' });
const ward = ProjectFolderStub({ name: '@dungeonmaster/ward', path: '/project/packages/ward' });

describe('WardScanResponder', () => {
  describe('the scan ran', () => {
    it('VALID: {rule, violations found} => prints the JSON report on stdout and leaves the exit code at 0', async () => {
      setExitCode(0);
      const proxy = WardScanResponderProxy();
      proxy.setupWorkspaces({ dirs: ['ward'], packageNames: ['@dungeonmaster/ward'] });
      proxy.setupPackageExit({
        projectFolder: ward,
        exitCode: 1,
        stdout: JSON.stringify([
          {
            filePath: '/project/packages/ward/src/a.ts',
            messages: [{ ruleId: 'no-console', line: 4, message: 'No console' }],
          },
        ]),
      });

      const result = await proxy.callResponder({
        args: ['node', 'ward', 'scan', 'no-console'],
        rootPath,
      });

      const exitCode = getExitCode();
      setExitCode(0);

      expect({
        result,
        stdout: JSON.parse(proxy.getStdoutText()) as unknown,
        stderr: proxy.getStderrText(),
        exitCode,
      }).toStrictEqual({
        result: { success: true },
        stdout: {
          rule: 'no-console',
          packages: [
            {
              name: '@dungeonmaster/ward',
              violations: 1,
              batches: [[{ file: 'packages/ward/src/a.ts', line: 4, message: 'No console' }]],
            },
          ],
        },
        stderr: '',
        exitCode: 0,
      });
    });

    it('VALID: {rule, clean package} => prints a report with zero violations', async () => {
      setExitCode(0);
      const proxy = WardScanResponderProxy();
      proxy.setupWorkspaces({ dirs: ['ward'], packageNames: ['@dungeonmaster/ward'] });
      proxy.setupPackageExit({ projectFolder: ward, exitCode: 0, stdout: '[]' });

      await proxy.callResponder({ args: ['node', 'ward', 'scan', 'no-console'], rootPath });

      const exitCode = getExitCode();
      setExitCode(0);

      expect({ stdout: proxy.getStdoutText(), exitCode }).toStrictEqual({
        stdout: `{
  "rule": "no-console",
  "packages": [
    {
      "name": "@dungeonmaster/ward",
      "violations": 0,
      "batches": []
    }
  ]
}
`,
        exitCode: 0,
      });
    });
  });

  describe('the scan failed', () => {
    it('ERROR: {no rule given} => prints the usage on stderr, nothing on stdout, exits 1', async () => {
      setExitCode(0);
      const proxy = WardScanResponderProxy();

      const result = await proxy.callResponder({ args: ['node', 'ward', 'scan'], rootPath });

      const exitCode = getExitCode();
      setExitCode(0);

      expect({
        result,
        stdout: proxy.getStdoutText(),
        stderr: proxy.getStderrText(),
        exitCode,
      }).toStrictEqual({
        result: { success: true },
        stdout: '',
        stderr:
          'Scan failed: scan needs a rule name first.\nUsage: npm run ward -- scan <rule> [-- <files or packages>]\n',
        exitCode: 1,
      });
    });

    it('ERROR: {eslint fails to load its config} => prints the failure on stderr and exits 1', async () => {
      setExitCode(0);
      const proxy = WardScanResponderProxy();
      proxy.setupWorkspaces({ dirs: ['ward'], packageNames: ['@dungeonmaster/ward'] });
      proxy.setupPackageExit({ projectFolder: ward, exitCode: 2, stdout: 'config broke' });

      await proxy.callResponder({ args: ['node', 'ward', 'scan', 'no-console'], rootPath });

      const exitCode = getExitCode();
      setExitCode(0);

      expect({
        stdout: proxy.getStdoutText(),
        stderr: proxy.getStderrText(),
        exitCode,
      }).toStrictEqual({
        stdout: '',
        stderr:
          'Scan failed: Scan of @dungeonmaster/ward for no-console failed (exit 2, signal null): config broke\n',
        exitCode: 1,
      });
    });
  });
});
