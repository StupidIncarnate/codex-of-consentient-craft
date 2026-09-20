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

      // A real failure carries `error`, never `message` — installExecuteBroker and every
      // StartInstall only ever populate one or the other, matching the success flag.
      const failResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/hooks',
          success: false,
          action: 'failed',
          error: 'No package.json found',
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

      const output = proxy.getStdoutOutput();

      expect(output).toStrictEqual([
        '[OK] @dungeonmaster/cli: Added devDependencies to package.json\n',
        '[FAIL] @dungeonmaster/hooks: No package.json found\n',
      ]);
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

      const output = proxy.getStdoutOutput();

      expect(output).toStrictEqual([
        '[OK] @dungeonmaster/cli: Installed successfully\n',
        '[OK] @dungeonmaster/hooks: Installed successfully\n',
      ]);
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

      const output = proxy.getStdoutOutput();

      expect(output).toStrictEqual([]);
    });
  });

  describe('failed result carrying an error', () => {
    it('VALID: {failed result with error, no message} => writes the error text', async () => {
      const proxy = CliInitResponderProxy();

      const failResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/hooks',
          success: false,
          action: 'failed',
          error: 'ENOENT: no such file or directory, open .claude/settings.json',
        },
      });

      proxy.setupInstallResults({ results: [failResult] });

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      await proxy.callResponder({ context });

      const output = proxy.getStdoutOutput();

      expect(output).toStrictEqual([
        '[FAIL] @dungeonmaster/hooks: ENOENT: no such file or directory, open .claude/settings.json\n',
      ]);
    });
  });

  describe('failed result carrying neither error nor message', () => {
    it('EMPTY: {failed result with no error and no message} => writes a fallback, never "undefined"', async () => {
      const proxy = CliInitResponderProxy();

      const failResult = InstallResultStub({
        value: {
          packageName: '@dungeonmaster/hooks',
          success: false,
          action: 'failed',
        },
      });

      proxy.setupInstallResults({ results: [failResult] });

      const context = InstallContextStub({
        value: {
          targetProjectRoot: '/project',
          dungeonmasterRoot: '/dm',
        },
      });

      await proxy.callResponder({ context });

      const output = proxy.getStdoutOutput();

      expect(output).toStrictEqual(['[FAIL] @dungeonmaster/hooks: no install message reported\n']);
    });
  });
});
