import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';

type Registry = ReturnType<typeof RegistryStub>;

export const instanceStateResolveBrokerProxy = (): {
  setupRegistry: (params: { registry: Registry }) => void;
  setupNow: (params: { nowMs: number }) => void;
} => {
  const registryProxy = registryReadBrokerProxy();
  const nowHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    setupRegistry: ({ registry }: { registry: Registry }): void => {
      registryProxy.setupPresentRegistry({ content: JSON.stringify(registry) });
    },

    setupNow: ({ nowMs }: { nowMs: number }): void => {
      nowHandle.calledWith([]).returns(nowMs);
    },
  };
};
