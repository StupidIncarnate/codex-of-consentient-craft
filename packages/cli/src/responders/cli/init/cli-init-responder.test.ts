import { InstallResultStub, InstallContextStub } from '@dungeonmaster/shared/contracts';
import { CliInitResponderProxy } from './cli-init-responder.proxy';

describe('CliInitResponder', () => {
  describe('mixed results', () => {
    it('VALID: {mix of OK and FAIL results} => writes formatted status lines to stdout', async () => {
      const proxy = CliInitResponderProxy();

      const successResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/cli',
          success: true,
          action: 'created',
          message: 'Added devDependencies to package.json',
        },
      });

      const failResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/hooks',
          success: false,
          action: 'skipped',
          message: 'No package.json found',
        },
      });

      proxy.setupInstallResults({ results: [successResult, failResult] });

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      await proxy.callResponder({ context });

      const spy = proxy.getStdoutOutput();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(
        1,
        '[OK] @dungeonmaster/cli: Added devDependencies to package.json\n',
      );
      expect(spy).toHaveBeenNthCalledWith(
        2,
        '[FAIL] @dungeonmaster/hooks: No package.json found\n',
      );
    });
  });

  describe('all succeed', () => {
    it('VALID: {all results succeed} => writes all OK status lines', async () => {
      const proxy = CliInitResponderProxy();

      const result1 = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/cli',
          success: true,
          action: 'created',
          message: 'Installed successfully',
        },
      });

      const result2 = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/hooks',
          success: true,
          action: 'created',
          message: 'Installed successfully',
        },
      });

      proxy.setupInstallResults({ results: [result1, result2] });

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      await proxy.callResponder({ context });

      const spy = proxy.getStdoutOutput();

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, '[OK] @dungeonmaster/cli: Installed successfully\n');
      expect(spy).toHaveBeenNthCalledWith(2, '[OK] @dungeonmaster/hooks: Installed successfully\n');
    });
  });

  describe('empty results', () => {
    it('EMPTY: {no packages found} => writes nothing to stdout', async () => {
      const proxy = CliInitResponderProxy();

      proxy.setupInstallResults({ results: [] });

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      await proxy.callResponder({ context });

      const spy = proxy.getStdoutOutput();

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
