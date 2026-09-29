import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';

const DEFAULT_RELEASED_AT_MS = 1_700_000_000_000;

export const instanceReleaseBrokerProxy = (): {
  setupCurrentRegistry: (params: { json: string }) => void;
  setupNow: (params: { nowMs: number }) => void;
  getWrittenRegistry: () => unknown;
} => {
  const updateProxy = registryUpdateBrokerProxy();
  const dateHandle = registerSpyOn({ object: Date, method: 'now' });
  dateHandle.calledWith([]).returns(DEFAULT_RELEASED_AT_MS);

  return {
    setupCurrentRegistry: ({ json }: { json: string }): void => {
      updateProxy.setupCurrentRegistry({ json });
    },

    setupNow: ({ nowMs }: { nowMs: number }): void => {
      dateHandle.calledWith([]).returns(nowMs);
    },

    getWrittenRegistry: (): unknown => {
      const written = updateProxy.getWrittenContent();
      return typeof written === 'string' ? JSON.parse(written) : undefined;
    },
  };
};
