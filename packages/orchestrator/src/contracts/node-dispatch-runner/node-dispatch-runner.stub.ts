import type { NodeDispatchRunnerController } from './node-dispatch-runner-contract';

export const NodeDispatchRunnerControllerStub = (): NodeDispatchRunnerController => ({
  start: () => undefined,
  stop: () => undefined,
  kick: async () => Promise.resolve(undefined),
});
