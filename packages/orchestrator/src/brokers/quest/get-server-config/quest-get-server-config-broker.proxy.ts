import { portResolveBrokerProxy } from '@dungeonmaster/shared/brokers/port/resolve/port-resolve-broker.proxy';

export const questGetServerConfigBrokerProxy = (): {
  setPort: (params: { value: string }) => void;
} => {
  const portProxy = portResolveBrokerProxy();

  return {
    setPort: ({ value }: { value: string }): void => {
      portProxy.setEnvPort({ value });
    },
  };
};
