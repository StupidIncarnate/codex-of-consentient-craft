import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import { imageServeBrokerProxy } from '../../../brokers/image/serve/image-serve-broker.proxy';
import { ImageServeResponder } from './image-serve-responder';

export const ImageServeResponderProxy = (): {
  setupFileBytes: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  setupReadFailure: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  callResponder: typeof ImageServeResponder;
  enableDevLogs: () => void;
  disableDevLogs: () => void;
  getDevLogOutput: () => RecordedCalls;
} => {
  const brokerProxy = imageServeBrokerProxy();
  const devLogProxy = processDevLogAdapterProxy();

  return {
    setupFileBytes: ({ filePath, bytes }): void => {
      brokerProxy.setupFileBytes({ filePath, bytes });
    },
    setupReadFailure: ({ filePath, error }): void => {
      brokerProxy.setupReadFailure({ filePath, error });
    },
    callResponder: ImageServeResponder,
    enableDevLogs: (): void => {
      devLogProxy.enableVerbose();
    },
    disableDevLogs: (): void => {
      devLogProxy.disableVerbose();
    },
    getDevLogOutput: (): RecordedCalls => devLogProxy.getWrittenLines(),
  };
};
