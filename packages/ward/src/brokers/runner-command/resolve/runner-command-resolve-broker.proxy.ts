import { execPath } from '#gateway/node/process';
import { execPathProxy } from '#gateway/node/process/exec-path/exec-path.proxy';

import { RunnerCommandStub } from '../../../contracts/runner-command/runner-command.stub';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { sourceConditionSupportedBrokerProxy } from '../../source-condition/supported/source-condition-supported-broker.proxy';

export const runnerCommandResolveBrokerProxy = (): {
  setupSourceRunner: (params: {
    cwd: string;
    binName: string;
  }) => ReturnType<typeof RunnerCommandStub>;
  setupBuiltRunner: (params: {
    cwd: string;
    binName: string;
  }) => ReturnType<typeof RunnerCommandStub>;
} => {
  execPathProxy();
  const binProxy = binResolveBrokerProxy();
  const sourceConditionProxy = sourceConditionSupportedBrokerProxy();

  return {
    // The `source` barrel is reachable, so the runner starts under this node with the condition.
    // Returns the command line the broker produces, so a composing proxy can stage the spawn on it.
    setupSourceRunner: ({
      cwd,
      binName,
    }: {
      cwd: string;
      binName: string;
    }): ReturnType<typeof RunnerCommandStub> => {
      const bin = binProxy.setupFound({ cwd, binName });
      sourceConditionProxy.setupSupported({ cwd });
      return RunnerCommandStub({ command: execPath, leadingArgs: ['--conditions=source', bin] });
    },

    // Models a consumer's install: `@dungeonmaster/shared` packs `dist` only, so the bin runs as is.
    setupBuiltRunner: ({
      cwd,
      binName,
    }: {
      cwd: string;
      binName: string;
    }): ReturnType<typeof RunnerCommandStub> => {
      const bin = binProxy.setupFound({ cwd, binName });
      sourceConditionProxy.setupUnsupported({ cwd });
      return RunnerCommandStub({ command: bin, leadingArgs: [] });
    },
  };
};
