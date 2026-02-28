import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';
import { childProcessExecAdapterProxy } from '../../../adapters/child-process/exec/child-process-exec-adapter.proxy';
import { CliServeResponder } from './cli-serve-responder';

export const CliServeResponderProxy = ({
  StartServer,
}: {
  StartServer: jest.Mock;
}): {
  callResponder: typeof CliServeResponder;
  setupPlatform: (params: { platform: NodeJS.Platform }) => void;
  getExecCalls: () => readonly unknown[];
  getStdoutOutput: () => readonly unknown[];
} => {
  const execProxy = childProcessExecAdapterProxy();
  runtimeDynamicImportAdapterProxy({ module: { StartServer } });

  const stdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation((): boolean => true);

  return {
    callResponder: CliServeResponder,

    setupPlatform: ({ platform }: { platform: NodeJS.Platform }): void => {
      Object.defineProperty(process, 'platform', { value: platform, configurable: true });
    },

    getExecCalls: (): readonly unknown[] => execProxy.getExecCalls(),

    getStdoutOutput: (): readonly unknown[] => stdoutWrite.mock.calls.map((call) => call[0]),
  };
};
