import { nowProxy } from '#gateway/node/Date/now/now.proxy';

import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';

const DEFAULT_RELEASED_AT_MS = 1_700_000_000_000;

export const instanceReleaseBrokerProxy = (): {
  setupCurrentRegistry: (params: { json: string }) => void;
  setupNow: (params: { nowMs: number }) => void;
  getWrittenRegistry: () => unknown;
  stageNextRegistryWriteFails: (params: { code: string }) => void;
} => {
  const updateProxy = registryUpdateBrokerProxy();
  const clockProxy = nowProxy();
  const released = { atMs: DEFAULT_RELEASED_AT_MS };
  clockProxy.setupNow({ ms: released.atMs });

  return {
    // The registry lock stages its own answer for the same clock read, so the release's own
    // answer is staged again after it and wins: `killedAtMs` reads the clock this proxy names.
    setupCurrentRegistry: ({ json }: { json: string }): void => {
      updateProxy.setupCurrentRegistry({ json });
      clockProxy.setupNow({ ms: released.atMs });
    },

    setupNow: ({ nowMs }: { nowMs: number }): void => {
      released.atMs = nowMs;
      clockProxy.setupNow({ ms: nowMs });
    },

    stageNextRegistryWriteFails: ({ code }: { code: string }): void => {
      updateProxy.stageNextWriteFails({ code });
    },

    getWrittenRegistry: (): unknown => {
      const written = updateProxy.getWrittenContent();
      return typeof written === 'string' ? JSON.parse(written) : undefined;
    },
  };
};
