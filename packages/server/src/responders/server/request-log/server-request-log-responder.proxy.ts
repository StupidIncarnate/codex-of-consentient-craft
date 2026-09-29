import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { processRequestLogAdapterProxy } from '../../../adapters/process/request-log/process-request-log-adapter.proxy';
import { ServerRequestLogResponder } from './server-request-log-responder';

export const ServerRequestLogResponderProxy = (): {
  enableRequestLog: () => void;
  disableRequestLog: () => void;
  getWrittenLines: () => RecordedCalls;
  callResponder: typeof ServerRequestLogResponder;
} => {
  const logProxy = processRequestLogAdapterProxy();

  return {
    enableRequestLog: (): void => {
      logProxy.enableRequestLog();
    },
    disableRequestLog: (): void => {
      logProxy.disableRequestLog();
    },
    getWrittenLines: (): RecordedCalls => logProxy.getWrittenLines(),
    callResponder: ServerRequestLogResponder,
  };
};
