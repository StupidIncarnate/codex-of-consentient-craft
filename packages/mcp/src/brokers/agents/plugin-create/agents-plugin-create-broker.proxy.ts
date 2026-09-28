import type { join } from 'path';
import { requireActual } from '@dungeonmaster/testing/register-mock';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { PathSegmentStub as FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics, mcpToolsStatics } from '@dungeonmaster/shared/statics';
import { agentsPluginCreateBroker } from './agents-plugin-create-broker';

type FilePath = ReturnType<typeof FilePathStub>;

export const agentsPluginCreateBrokerProxy = (): {
  callBroker: typeof agentsPluginCreateBroker;
  setupSuccess: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => void;
  getWrittenPluginJson: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => unknown;
  getWrittenMcpConfigJson: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => unknown;
} => {
  const writeProxy = fsWriteFileAdapterProxy();
  const mkdirGateway = ensureDirProxy();
  pathJoinAdapterProxy();

  const actualPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const pluginDirFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): FilePath =>
    FilePathStub({
      value: actualPath.join(
        targetProjectRoot,
        locationsStatics.repoRoot.agents.dir,
        locationsStatics.repoRoot.agents.pluginsDir,
        mcpToolsStatics.server.name,
      ),
    });

  const pluginJsonPathFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): FilePath =>
    FilePathStub({
      value: actualPath.join(
        pluginDirFor({ targetProjectRoot }),
        locationsStatics.repoRoot.agents.pluginJson,
      ),
    });

  const mcpConfigJsonPathFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): FilePath =>
    FilePathStub({
      value: actualPath.join(
        pluginDirFor({ targetProjectRoot }),
        locationsStatics.repoRoot.agents.mcpConfigJson,
      ),
    });

  return {
    callBroker: agentsPluginCreateBroker,
    setupSuccess: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): void => {
      mkdirGateway.succeeds({ path: pluginDirFor({ targetProjectRoot }) });
      writeProxy.succeeds({ filepath: pluginJsonPathFor({ targetProjectRoot }) });
      writeProxy.succeeds({ filepath: mcpConfigJsonPathFor({ targetProjectRoot }) });
    },
    getWrittenPluginJson: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): unknown =>
      writeProxy.getWrittenFor({ filepath: pluginJsonPathFor({ targetProjectRoot }) }),
    getWrittenMcpConfigJson: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): unknown =>
      writeProxy.getWrittenFor({ filepath: mcpConfigJsonPathFor({ targetProjectRoot }) }),
  };
};
