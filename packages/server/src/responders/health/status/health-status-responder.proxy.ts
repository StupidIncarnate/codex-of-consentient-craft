import { healthStatusBrokerProxy } from '../../../brokers/health/status/health-status-broker.proxy';
import { HealthStatusResponder } from './health-status-responder';

export const HealthStatusResponderProxy = (): {
  setupHealth: (params: { uptime: number; version: string }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof HealthStatusResponder;
} => {
  const healthProxy = healthStatusBrokerProxy();

  return {
    setupHealth: ({ uptime, version }: { uptime: number; version: string }): void => {
      healthProxy.stagesHealth({ uptime, version });
    },
    setupError: ({ message }: { message: string }): void => {
      healthProxy.stagesVersionReadFailure({ error: new Error(message) });
    },
    callResponder: HealthStatusResponder,
  };
};
