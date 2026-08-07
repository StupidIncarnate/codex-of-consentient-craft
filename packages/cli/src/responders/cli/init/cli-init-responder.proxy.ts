import type { InstallResultStub } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { installRunBrokerProxy } from '../../../brokers/install/run/install-run-broker.proxy';
import { FileNameStub } from '@dungeonmaster/shared/contracts';
import { CliInitResponder } from './cli-init-responder';

type InstallResult = ReturnType<typeof InstallResultStub>;

export const CliInitResponderProxy = (): {
  callResponder: typeof CliInitResponder;
  setupInstallResults: (params: { results: InstallResult[] }) => void;
  getStdoutOutput: () => readonly unknown[];
} => {
  const brokerProxy = installRunBrokerProxy();

  // The spy's only job is to record calls: getStdoutOutput() reads them back with
  // callsMatching([]) and tests assert the full ordered output with toStrictEqual, so the
  // written text is verified there, not by this staging description. calledWith([]) is a
  // deliberate catch-all — every write matches and resolves — so nothing forwards to real
  // stdout and no write throws for going undescribed.
  const stdoutWriteSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutWriteSpy.calledWith([]).returns(true);

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

      const startInstallFn = jest.fn();
      const startInstallHandle = registerMock({ fn: startInstallFn });
      for (const result of results) {
        // installExecuteBroker calls startInstallFn({ context }) with the SAME context object
        // for every package — there is no per-package argument to key on, so order is the only
        // real differentiator between results.
        startInstallHandle.onceFor([]).resolves(result);
      }
      const module = Object.create(null) as Record<PropertyKey, unknown>;
      module.StartInstall = startInstallFn;
      // Keyed on each discovered package's own installPath (its standardPath, since every
      // package above is staged as installerLocation: 'standard') — installOrchestrateBroker
      // calls installExecuteBroker once per package with that package's own installPath.
      for (const pkg of packages) {
        brokerProxy.setupImport({ installPath: pkg.standardPath, module });
      }
    },

    getStdoutOutput: (): readonly unknown[] =>
      stdoutWriteSpy.callsMatching([]).map((call) => call[0]),
  };
};
