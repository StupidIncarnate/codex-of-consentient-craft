import { childProcessExecAdapterProxy } from '../../../adapters/child-process/exec/child-process-exec-adapter.proxy';
import { ExecResultStub } from '../../../contracts/exec-result/exec-result.stub';

export const wardRunBrokerProxy = (): {
  setupWardPasses: ({ output }: { output: string }) => void;
  setupWardFails: ({ stdout, stderr }: { stdout?: string; stderr?: string }) => void;
} => {
  const execProxy = childProcessExecAdapterProxy();

  return {
    setupWardPasses: ({ output }: { output: string }): void => {
      execProxy.resolves({
        result: ExecResultStub({
          stdout: output,
          stderr: '',
          exitCode: 0,
        }),
      });
    },
    setupWardFails: ({ stdout = '', stderr = '' }: { stdout?: string; stderr?: string }): void => {
      execProxy.resolves({
        result: ExecResultStub({
          stdout,
          stderr,
          exitCode: 1,
        }),
      });
    },
  };
};
