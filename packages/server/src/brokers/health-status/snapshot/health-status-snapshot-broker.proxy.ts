import { processUptimeAdapterProxy } from '../../../adapters/process/uptime/process-uptime-adapter.proxy';
import { serverVersionReadAdapterProxy } from '../../../adapters/server-version/read/server-version-read-adapter.proxy';

export const healthStatusSnapshotBrokerProxy = (): {
  setupSnapshot: (params: { uptimeSeconds: number; version: string }) => void;
} => {
  const uptimeProxy = processUptimeAdapterProxy();
  const versionProxy = serverVersionReadAdapterProxy();

  return {
    setupSnapshot: ({
      uptimeSeconds,
      version,
    }: {
      uptimeSeconds: number;
      version: string;
    }): void => {
      uptimeProxy.returns({ seconds: uptimeSeconds });
      versionProxy.returnsVersion({ version });
    },
  };
};
