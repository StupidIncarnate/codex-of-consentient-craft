import type { InstallResultStub } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { installRunBrokerProxy } from '../../../brokers/install/run/install-run-broker.proxy';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { CliInitResponder } from './cli-init-responder';

type InstallResult = ReturnType<typeof InstallResultStub>;

export const CliInitResponderProxy = (): {
  callResponder: typeof CliInitResponder;
  setupInstallResults: (params: { results: InstallResult[] }) => void;
  getStdoutOutput: () => readonly unknown[];
} => {
  const brokerProxy = installRunBrokerProxy();

  const stdoutWriteSpy = registerSpyOn({
    object: process.stdout,
    method: 'write',
    passthrough: true,
  });
  stdoutWriteSpy.mockImplementation((): boolean => true);

  return {
    callResponder: CliInitResponder,

    setupInstallResults: ({ results }: { results: InstallResult[] }): void => {
      const packages = results.map((_result, index) => ({
        name: FileNameStub({ value: `package-${String(index)}` }),
        standardPath: FilePathStub({
          value: `/dm/packages/package-${String(index)}/dist/startup/start-install.js`,
        }),
        installerLocation: 'standard' as const,
      }));

      brokerProxy.setupPackageDiscovery({
        packagesPath: FilePathStub({ value: '/dm/packages' }),
        packages,
      });

      const mockFn = jest.fn();
      for (const result of results) {
        mockFn.mockResolvedValueOnce(result);
      }
      const module = Object.create(null) as Record<PropertyKey, unknown>;
      module.StartInstall = mockFn;
      brokerProxy.setupImport({ module });
    },

    getStdoutOutput: (): readonly unknown[] => stdoutWriteSpy.mock.calls.map((call) => call[0]),
  };
};
