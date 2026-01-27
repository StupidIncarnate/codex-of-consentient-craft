import { questUpdateStepBrokerProxy } from '../../quest/update-step/quest-update-step-broker.proxy';

export const handleSignalLayerBrokerProxy = (): {
  questUpdateStepProxy: ReturnType<typeof questUpdateStepBrokerProxy>;
} => {
  const questUpdateStepProxy = questUpdateStepBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    questUpdateStepProxy,
  };
};
