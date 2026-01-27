import { childProcessExecAdapterProxy } from '../../../adapters/child-process/exec/child-process-exec-adapter.proxy';

export const wardRunBrokerProxy = (): {
  execProxy: ReturnType<typeof childProcessExecAdapterProxy>;
} => {
  const execProxy = childProcessExecAdapterProxy();

  return {
    execProxy,
  };
};
