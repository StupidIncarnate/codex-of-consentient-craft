import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardRunResponderProxy } from './ward-run-responder.proxy';

describe('WardRunResponder', () => {
  describe('basic run command', () => {
    it('VALID: {args with run command} => calls broker and completes without error', async () => {
      const proxy = WardRunResponderProxy();
      proxy.setupSinglePackagePass();

      await proxy.callResponder({
        args: ['node', 'ward', 'run'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('--only lint flag', () => {
    it('VALID: {args with --only lint} => parses flag and runs only lint check', async () => {
      const proxy = WardRunResponderProxy();
      proxy.setupSinglePackageLintOnly();

      await proxy.callResponder({
        args: ['node', 'ward', 'run', '--only', 'lint'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('passthrough files', () => {
    it('VALID: {args with -- file1 file2} => parses passthrough and delegates to broker', async () => {
      const proxy = WardRunResponderProxy();
      proxy.setupSinglePackagePass();

      await proxy.callResponder({
        args: ['node', 'ward', 'run', '--', 'src/index.ts', 'src/utils.ts'],
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(process.exit).not.toHaveBeenCalled();
    });
  });
});
