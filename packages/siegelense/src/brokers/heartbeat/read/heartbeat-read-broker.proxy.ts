/**
 * PURPOSE: Composes the evidence-path resolution and the file read `heartbeatReadBroker` makes,
 * behind two semantic scenarios — a beat that is there, and one that never landed. Consumers
 * (`instanceEntryLayerBrokerProxy`) call these to describe an instance's heartbeat without knowing
 * this broker resolves its own evidence path independently on every call. The heartbeat-path join is
 * staged on `#gateway/node/path`'s own `join` mock (the same one `locationsInstanceEvidencePathFindBrokerProxy`
 * registers), addressed by its own exact tuple — `[evidencePath, heartbeat filename]` — so it never
 * depends on call order relative to any sibling resolver's own join call, unlike the shared
 * `pathJoinAdapter` queue this used to ride.
 *
 * USAGE:
 * const proxy = heartbeatReadBrokerProxy();
 * proxy.setupHeartbeatFound({ homeDir, homePath, rootPath, evidencePath, heartbeat });
 */

import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';

type InstanceHeartbeat = ReturnType<typeof InstanceHeartbeatStub>;

export const heartbeatReadBrokerProxy = (): {
  setupHeartbeatFound: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
    heartbeat: InstanceHeartbeat;
  }) => void;
  setupHeartbeatMissing: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
  }) => void;
  setupHeartbeatReadFails: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
    error: Error;
  }) => void;
} => {
  errorIsNativeErrorAdapterProxy();
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  // Shares the same '#gateway/node/path' join handle evidencePathProxy's own constructor registers
  // — addressed here on this file's OWN exact tuple, never a bare `calledWith([])`.
  const joinHandle = registerMock({ fn: join });
  const readProxy = fsReadFileAdapterProxy();

  return {
    setupHeartbeatFound: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
      heartbeat,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
      heartbeat: InstanceHeartbeat;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });
      const heartbeatPathValue = `${evidencePath}/${locationsStatics.siegelense.heartbeat}`;
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(FilePathStub({ value: heartbeatPathValue }));
      readProxy.resolves({
        filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }),
        content: `${JSON.stringify(heartbeat)}\n`,
      });
    },

    setupHeartbeatMissing: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });
      const heartbeatPathValue = `${evidencePath}/${locationsStatics.siegelense.heartbeat}`;
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(FilePathStub({ value: heartbeatPathValue }));
      readProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }),
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupHeartbeatReadFails: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
      error,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
      error: Error;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });
      const heartbeatPathValue = `${evidencePath}/${locationsStatics.siegelense.heartbeat}`;
      joinHandle
        .calledWith([evidencePath, locationsStatics.siegelense.heartbeat])
        .returns(FilePathStub({ value: heartbeatPathValue }));
      readProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }),
        error,
      });
    },
  };
};
