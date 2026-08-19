import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import {
  dungeonmasterHomeFindBrokerProxy,
  portResolveBrokerProxy,
} from '@dungeonmaster/shared/testing';
import type { OrchestrationModeStub } from '@dungeonmaster/shared/contracts';
import { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetOrchestrationModeAdapterProxy } from '../../../adapters/orchestrator/get-orchestration-mode/orchestrator-get-orchestration-mode-adapter.proxy';
import { processUptimeAdapterProxy } from '../../../adapters/process/uptime/process-uptime-adapter.proxy';
import { serverPackageVersionAdapterProxy } from '../../../adapters/server-package/version/server-package-version-adapter.proxy';

type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;

export const healthSnapshotBrokerProxy = (): {
  setupSnapshot: (params: {
    uptimeSeconds: number;
    version: string;
    port: number;
    home: string;
    orchestrationMode: OrchestrationMode;
    timestamp: string;
  }) => void;
  setupVersionFailure: (params: { error: Error }) => void;
  setupModeFailure: (params: { error: Error }) => void;
  clearEnv: () => void;
} => {
  const modeProxy = orchestratorGetOrchestrationModeAdapterProxy();
  const uptimeProxy = processUptimeAdapterProxy();
  const versionProxy = serverPackageVersionAdapterProxy();
  const portProxy = portResolveBrokerProxy();
  const homeProxy = dungeonmasterHomeFindBrokerProxy();
  const clock = registerSpyOn({ object: Date.prototype, method: 'toISOString' });

  return {
    setupSnapshot: ({
      uptimeSeconds,
      version,
      port,
      home,
      orchestrationMode,
      timestamp,
    }: {
      uptimeSeconds: number;
      version: string;
      port: number;
      home: string;
      orchestrationMode: OrchestrationMode;
      timestamp: string;
    }): void => {
      modeProxy.returns({ mode: orchestrationMode });
      uptimeProxy.returnsSeconds({ seconds: uptimeSeconds });
      versionProxy.returnsManifest({ version });
      portProxy.setEnvPort({ value: String(port) });
      homeProxy.setHomeEnv({ value: home });
      clock.calledWith([]).returns(timestamp);
    },

    // Everything the broker touches BEFORE `version` in the parse object literal — orchestrationMode
    // (awaited), homePath (computed before the parse call), timestamp and uptimeSeconds (evaluated
    // ahead of version inside the literal) — must resolve so the version read is the ONLY failure.
    setupVersionFailure: ({ error }: { error: Error }): void => {
      const defaults = HealthSnapshotStub();
      modeProxy.returns({ mode: defaults.orchestrationMode });
      homeProxy.setHomeEnv({ value: defaults.home });
      uptimeProxy.returnsSeconds({ seconds: defaults.uptimeSeconds });
      clock.calledWith([]).returns(defaults.timestamp);
      versionProxy.readFails({ error });
    },

    // orchestrationMode is the FIRST await in the broker — nothing downstream is ever reached.
    setupModeFailure: ({ error }: { error: Error }): void => {
      modeProxy.throws({ error });
    },

    clearEnv: (): void => {
      portProxy.clearEnvPort();
      homeProxy.clearHomeEnv();
    },
  };
};
