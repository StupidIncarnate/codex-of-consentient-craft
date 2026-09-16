/**
 * PURPOSE: Composes the evidence-path resolution and the file read `heartbeatReadBroker` makes,
 * behind two semantic scenarios — a beat that is there, and one that never landed. Consumers
 * (`instanceEntryLayerBrokerProxy`) call these to describe an instance's heartbeat without knowing
 * this broker resolves its own evidence path independently on every call. The heartbeat-path join
 * itself is explicitly staged via `.returns()`, never left to `pathJoinAdapter`'s real-passthrough
 * default: a composing test (`instanceEntryLayerBrokerProxy`) stages OTHER future path resolutions
 * before this one runs, and an unstaged call here would consume one of those instead of computing
 * its own real join (the same rule `heartbeat-write-broker.proxy.ts` follows for the same join).
 *
 * USAGE:
 * const proxy = heartbeatReadBrokerProxy();
 * proxy.setupHeartbeatFound({ homeDir, homePath, rootPath, evidencePath, heartbeat });
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
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
  const heartbeatPathJoinProxy = pathJoinAdapterProxy();
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
      heartbeatPathJoinProxy.returns({ result: FilePathStub({ value: heartbeatPathValue }) });
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
      heartbeatPathJoinProxy.returns({ result: FilePathStub({ value: heartbeatPathValue }) });
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
      heartbeatPathJoinProxy.returns({ result: FilePathStub({ value: heartbeatPathValue }) });
      readProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }),
        error,
      });
    },
  };
};
