import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';
import { locationsStatics, mcpToolsStatics } from '@dungeonmaster/shared/statics';
import { agentsPluginCreateBroker } from './agents-plugin-create-broker';

type FilePath = string;

export const agentsPluginCreateBrokerProxy = (): {
  callBroker: typeof agentsPluginCreateBroker;
  setupSuccess: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => void;
  getWrittenPluginJson: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => unknown;
  getWrittenMcpConfigJson: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => unknown;
} => {
  const writeGateway = writeFileProxy();
  const mkdirGateway = ensureDirProxy();

  // The gateway ships no per-file proxy for `join` (it is a bare re-export of the Node builtin),
  // so this mocks the `#gateway/node/path` import directly, per the recipe's own fallback — with
  // a real-passthrough default, since several segments below are computed from this same real
  // join rather than staged one at a time.
  const joinHandle = registerMock({ fn: join });
  const actualPath = requireActual<{ join: typeof join }>({ module: '#gateway/node/path' });
  joinHandle
    .calledWith([])
    .implement(((...segments: unknown[]) =>
      actualPath.join(...(segments as Parameters<typeof join>))) as (...args: never[]) => unknown);

  const pluginDirFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): FilePath =>
    actualPath.join(
        targetProjectRoot,
        locationsStatics.repoRoot.agents.dir,
        locationsStatics.repoRoot.agents.pluginsDir,
        mcpToolsStatics.server.name,
      );

  const pluginJsonPathFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): FilePath =>
    actualPath.join(
        pluginDirFor({ targetProjectRoot }),
        locationsStatics.repoRoot.agents.pluginJson,
      );

  const mcpConfigJsonPathFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): FilePath =>
    actualPath.join(
        pluginDirFor({ targetProjectRoot }),
        locationsStatics.repoRoot.agents.mcpConfigJson,
      );

  return {
    callBroker: agentsPluginCreateBroker,
    setupSuccess: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): void => {
      mkdirGateway.succeeds({ path: pluginDirFor({ targetProjectRoot }) });
      writeGateway.succeeds({ path: pluginJsonPathFor({ targetProjectRoot }) });
      writeGateway.succeeds({ path: mcpConfigJsonPathFor({ targetProjectRoot }) });
    },
    getWrittenPluginJson: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): unknown =>
      writeGateway.writtenContentsFor({ path: pluginJsonPathFor({ targetProjectRoot }) }),
    getWrittenMcpConfigJson: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): unknown =>
      writeGateway.writtenContentsFor({ path: mcpConfigJsonPathFor({ targetProjectRoot }) }),
  };
};
