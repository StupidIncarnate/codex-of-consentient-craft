import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';

export const heartbeatWriteBrokerProxy = (): {
  setupHeartbeatWrite: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    evidencePath: FilePath;
    registryJson: string;
    nowMs: number;
  }) => void;
  getWrittenHeartbeatPath: (params: { evidencePath: FilePath }) => unknown;
  getWrittenHeartbeatContent: (params: { evidencePath: FilePath }) => unknown;
  getRegistryWrittenContent: () => unknown;
} => {
  // heartbeatWriteBroker resolves the evidence dir, joins the heartbeat filename onto it, writes
  // the file, then read-mutate-writes the registry — the child proxies below are staged in that
  // same order, since pathJoinAdapter's mock is a single call-ordered queue shared by every proxy
  // that stages it (see locations-instance-evidence-path-find-broker.proxy.ts for the same rule
  // applied to a shorter chain).
  const evidencePathProxy = locationsInstanceEvidencePathFindBrokerProxy();
  const heartbeatPathJoinProxy = pathJoinAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const registryProxy = registryUpdateBrokerProxy();
  const dateHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    setupHeartbeatWrite: ({
      homeDir,
      homePath,
      rootPath,
      evidencePath,
      registryJson,
      nowMs,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      evidencePath: FilePath;
      registryJson: string;
      nowMs: number;
    }): void => {
      evidencePathProxy.setupInstanceEvidencePath({ homeDir, homePath, rootPath, evidencePath });

      const heartbeatPathValue = `${evidencePath}/${locationsStatics.siegelense.heartbeat}`;
      heartbeatPathJoinProxy.returns({ result: FilePathStub({ value: heartbeatPathValue }) });
      writeProxy.succeeds({ filePath: AbsoluteFilePathStub({ value: heartbeatPathValue }) });

      registryProxy.setupCurrentRegistry({ json: registryJson });
      dateHandle.calledWith([]).returns(nowMs);
    },

    // Echoes what setup already computed — self-documenting in a test's assertion, the same role
    // registryWriteBrokerProxy's getWrittenPath() plays for its own tmp path.
    getWrittenHeartbeatPath: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      `${evidencePath}/${locationsStatics.siegelense.heartbeat}`,

    getWrittenHeartbeatContent: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      writeProxy.getWrittenFor({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.heartbeat}`,
        }),
      }),

    getRegistryWrittenContent: (): unknown => registryProxy.getWrittenContent(),
  };
};
