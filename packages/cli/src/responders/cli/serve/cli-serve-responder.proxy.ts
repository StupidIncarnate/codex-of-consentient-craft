import {
  portResolveBrokerProxy,
  runtimeDynamicImportAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { childProcessExecAdapterProxy } from '../../../adapters/child-process/exec/child-process-exec-adapter.proxy';
import { CliServeResponder } from './cli-serve-responder';

const PORT = '3737';
const SERVER_URL = `http://${environmentStatics.hostname}:${PORT}`;

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
  // The responder resolves its module specifier via require.resolve('@dungeonmaster/server') —
  // not a literal we can write ahead of time (it depends on the host's node_modules layout).
  // Calling the identical require.resolve() here, in the same process and directory, reproduces
  // the exact address the responder's own call computes, so this is the real value, not a guess.
  const serverPath = require.resolve('@dungeonmaster/server');
  const importProxy = runtimeDynamicImportAdapterProxy();
  importProxy.succeeds({ path: serverPath, module: { StartServer } });
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: PORT });

  // The spy's only job is to record calls: getStdoutOutput() reads them back with
  // callsMatching([]) and the test asserts the full ordered output with toStrictEqual, so the
  // written text is verified there, not by this staging description. calledWith([]) is a
  // deliberate catch-all — every write matches and resolves — so nothing forwards to real
  // stdout and no write throws for going undescribed.
  const stdoutWrite = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutWrite.calledWith([]).returns(true);

  return {
    callResponder: CliServeResponder,

    setupPlatform: ({ platform }: { platform: NodeJS.Platform }): void => {
      Object.defineProperty(process, 'platform', { value: platform, configurable: true });
      // Mirrors the responder's own platform ternary so the exec mock is described with the
      // exact command that platform produces.
      const cmd =
        platform === 'darwin'
          ? `open ${SERVER_URL}`
          : platform === 'win32'
            ? `start ${SERVER_URL}`
            : `xdg-open ${SERVER_URL}`;
      execProxy.succeeds({ command: cmd });
    },

    getExecCalls: (): readonly unknown[] => execProxy.getExecCalls(),

    getStdoutOutput: (): readonly unknown[] => stdoutWrite.callsMatching([]).map((call) => call[0]),
  };
};
