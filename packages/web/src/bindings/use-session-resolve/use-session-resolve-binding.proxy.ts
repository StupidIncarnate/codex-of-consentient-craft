import { guildSessionResolveBrokerProxy } from '../../brokers/guild/session-resolve/guild-session-resolve-broker.proxy';
import type { SessionResolveResponse } from '../../contracts/session-resolve-response/session-resolve-response-contract';

export const useSessionResolveBindingProxy = (): {
  setupResponse: (params: { response: SessionResolveResponse }) => void;
  setupError: () => void;
} => {
  const brokerProxy = guildSessionResolveBrokerProxy();

  return {
    setupResponse: ({ response }: { response: SessionResolveResponse }): void => {
      brokerProxy.setupResponse({ response });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
  };
};
