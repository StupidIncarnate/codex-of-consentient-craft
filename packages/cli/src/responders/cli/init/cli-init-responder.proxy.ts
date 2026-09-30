import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import type { InstallResultStub } from '@dungeonmaster/shared/contracts/install-result/install-result.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { installRunBrokerProxy } from '../../../brokers/install/run/install-run-broker.proxy';
import { CliInitResponder } from './cli-init-responder';

type InstallResult = ReturnType<typeof InstallResultStub>;

export const CliInitResponderProxy = (): {
  callResponder: typeof CliInitResponder;
  setupInstallResults: (params: { results: InstallResult[] }) => void;
  getStdoutOutput: () => readonly unknown[];
} => {
  const brokerProxy = installRunBrokerProxy();
  const stdout = stdoutProxy();
  const stagedStarts: { handle: ReturnType<typeof registerMock>; result: InstallResult }[] = [];

  return {
    // StartInstall is called with `{ context }`, the context this call receives, so each package's
    // own StartInstall is staged against that exact tuple once the test supplies it.
    callResponder: async ({ context }) => {
      for (const { handle, result } of stagedStarts) {
        handle.calledWith([{ context }]).resolves(result);
      }
      return CliInitResponder({ context });
    },

    setupInstallResults: ({ results }: { results: InstallResult[] }): void => {
      const packages = results.map((_result, index) => ({
        name: `package-${String(index)}`,
        standardPath: `/dm/packages/package-${String(index)}/dist/startup/start-install.js`,
        installerLocation: 'standard' as const,
      }));

      brokerProxy.setupPackageDiscovery({
        packagesPath: '/dm/packages',
        packages,
      });

      // Keyed on each discovered package's own installPath (its standardPath, since every
      // package above is staged as installerLocation: 'standard'), and each package's module
      // carries its own StartInstall, so no result depends on call order.
      for (const [index, pkg] of packages.entries()) {
        const startInstallFn = jest.fn();
        const handle = registerMock({ fn: startInstallFn });
        const result = results[index];
        if (result !== undefined) {
          stagedStarts.push({ handle, result });
        }
        const module = Object.create(null) as Record<PropertyKey, unknown>;
        module.StartInstall = startInstallFn;
        brokerProxy.setupImport({ installPath: pkg.standardPath, module });
      }
    },

    getStdoutOutput: (): readonly unknown[] => stdout.getWrites(),
  };
};
