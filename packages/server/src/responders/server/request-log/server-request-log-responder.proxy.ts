import { processRequestLogBrokerProxy } from '../../../brokers/process/request-log/process-request-log-broker.proxy';
import { ServerRequestLogResponder } from './server-request-log-responder';

export const ServerRequestLogResponderProxy = (): {
  enableRequestLog: () => void;
  disableRequestLog: () => void;
  getWrittenLines: () => unknown[][];
  callResponder: typeof ServerRequestLogResponder;
} => {
  const logProxy = processRequestLogBrokerProxy();

  return {
    enableRequestLog: (): void => {
      logProxy.enableRequestLog();
    },
    disableRequestLog: (): void => {
      logProxy.disableRequestLog();
    },
    getWrittenLines: (): unknown[][] => logProxy.getWrittenLines(),
    callResponder: ServerRequestLogResponder,
  };
};
