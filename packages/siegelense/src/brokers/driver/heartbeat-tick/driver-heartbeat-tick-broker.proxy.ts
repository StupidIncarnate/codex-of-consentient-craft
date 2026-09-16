/**
 * PURPOSE: Composes heartbeatWriteBrokerProxy behind one semantic setup method, fixing the
 * home/root path triple every heartbeat write in this package resolves through so a test only ever
 * names its own instance-specific evidence path.
 *
 * USAGE:
 * const proxy = driverHeartbeatTickBrokerProxy();
 * proxy.stageBeatSucceeds({ evidencePath, registryJson, nowMs });
 */

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { heartbeatWriteBrokerProxy } from '../../heartbeat/write/heartbeat-write-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

export const driverHeartbeatTickBrokerProxy = (): {
  stageBeatSucceeds: (params: {
    evidencePath: FilePath;
    registryJson: string;
    nowMs: number;
  }) => void;
  getWrittenHeartbeatContent: (params: { evidencePath: FilePath }) => unknown;
} => {
  const heartbeatProxy = heartbeatWriteBrokerProxy();

  return {
    stageBeatSucceeds: ({
      evidencePath,
      registryJson,
      nowMs,
    }: {
      evidencePath: FilePath;
      registryJson: string;
      nowMs: number;
    }): void => {
      heartbeatProxy.setupHeartbeatWrite({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        registryJson,
        nowMs,
      });
    },

    getWrittenHeartbeatContent: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      heartbeatProxy.getWrittenHeartbeatContent({ evidencePath }),
  };
};
