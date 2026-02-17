import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { projectRootFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { commandRunBrokerProxy } from '../brokers/command/run/command-run-broker.proxy';
import { commandListBrokerProxy } from '../brokers/command/list/command-list-broker.proxy';
import { commandDetailBrokerProxy } from '../brokers/command/detail/command-detail-broker.proxy';
import { commandRawBrokerProxy } from '../brokers/command/raw/command-raw-broker.proxy';

export const StartWardProxy = (): {
  setupCwd: (params: { cwd: string }) => void;
} => {
  jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

  projectRootFindBrokerProxy();
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  commandRunBrokerProxy();
  commandListBrokerProxy();
  commandDetailBrokerProxy();
  commandRawBrokerProxy();

  return {
    setupCwd: ({ cwd }: { cwd: string }): void => {
      jest.spyOn(process, 'cwd').mockReturnValue(cwd);
      captureProxy.setupSuccess({ exitCode: ExitCodeStub({ value: 0 }), stdout: cwd, stderr: '' });
    },
  };
};
