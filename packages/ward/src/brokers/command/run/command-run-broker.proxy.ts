import { orchestrateRunAllBrokerProxy } from '../../orchestrate/run-all/orchestrate-run-all-broker.proxy';

export const commandRunBrokerProxy = (): {
  setupPassingRun: (params: {
    gitOutput: string;
    packageContents: string[];
    checkCount: number;
  }) => void;
} => {
  jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

  const orchestrateProxy = orchestrateRunAllBrokerProxy();

  return {
    setupPassingRun: ({
      gitOutput,
      packageContents,
      checkCount,
    }: {
      gitOutput: string;
      packageContents: string[];
      checkCount: number;
    }): void => {
      orchestrateProxy.setupDefaultRun({ gitOutput, packageContents, checkCount });
    },
  };
};
