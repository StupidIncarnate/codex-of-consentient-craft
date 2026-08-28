import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { serverPackageVersionAdapterProxy } from '../../../adapters/server-package/version/server-package-version-adapter.proxy';

export const healthStatusBrokerProxy = (): {
  stagesHealth: (params: { uptime: number; version: string }) => void;
  stagesVersionReadFailure: (params: { error: Error }) => void;
} => {
  const versionProxy = serverPackageVersionAdapterProxy();
  // process.uptime() takes no arguments, so there is nothing to key the address on.
  const uptimeHandle = registerSpyOn({ object: process, method: 'uptime' });

  return {
    stagesHealth: ({ uptime, version }: { uptime: number; version: string }): void => {
      uptimeHandle.calledWith([]).returns(uptime);
      versionProxy.stagesVersion({ version });
    },
    // Health-status-responder's ERROR path proves the broker throws for real, so this
    // reaches down to the one dependency that can make it: the version read. Uptime is
    // staged too — the broker reads it first, and an unstaged registerSpyOn throws on its
    // own, which would attribute the failure to the wrong dependency.
    stagesVersionReadFailure: ({ error }: { error: Error }): void => {
      uptimeHandle.calledWith([]).returns(0);
      versionProxy.readFails({ error });
    },
  };
};
