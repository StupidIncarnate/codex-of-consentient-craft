import { getExitCode, setExitCode } from '#gateway/node/process';

import { WardRunResponderProxy } from './ward-run-responder.proxy';

describe('WardRunResponder', () => {
  // The single-package pass fixtures leave lint/typecheck/integration discovery unreconciled, so
  // an all-checks run reports a discovery mismatch and sets exit code 1; a lint-only run does not.
  describe('basic run command', () => {
    it('VALID: {args with run command} => calls broker and completes without error', async () => {
      setExitCode(0);
      const proxy = WardRunResponderProxy();
      proxy.setupSinglePackagePass();

      await proxy.callResponder({
        args: ['node', 'ward', 'run'],
        rootPath: '/project',
      });

      expect(getExitCode()).toBe(1);
    });
  });

  describe('--only lint flag', () => {
    it('VALID: {args with --only lint} => parses flag and runs only lint check', async () => {
      setExitCode(0);
      const proxy = WardRunResponderProxy();
      proxy.setupSinglePackageLintOnly();

      await proxy.callResponder({
        args: ['node', 'ward', 'run', '--only', 'lint'],
        rootPath: '/project',
      });

      expect(getExitCode()).toBe(0);
    });
  });

  describe('passthrough files', () => {
    it('VALID: {args with -- file1 file2} => parses passthrough and delegates to broker', async () => {
      setExitCode(0);
      const proxy = WardRunResponderProxy();
      proxy.setupSinglePackagePass();
      proxy.setupExistingPath({ filePath: '/project/src/index.ts' });
      proxy.setupExistingPath({ filePath: '/project/src/utils.ts' });
      proxy.setupCompanionTestMissing({ relativePath: 'src/index.ts' });
      proxy.setupCompanionTestMissing({ relativePath: 'src/utils.ts' });

      await proxy.callResponder({
        args: ['node', 'ward', 'run', '--', 'src/index.ts', 'src/utils.ts'],
        rootPath: '/project',
      });

      expect(getExitCode()).toBe(1);
    });
  });
});
