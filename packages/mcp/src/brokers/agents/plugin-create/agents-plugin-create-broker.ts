/**
 * PURPOSE: Scaffolds the Antigravity plugin for dungeonmaster (.agents/plugins/dungeonmaster/)
 * containing plugin.json and mcp_config.json so Antigravity discovers the dungeonmaster MCP server
 *
 * USAGE:
 * await agentsPluginCreateBroker({ targetProjectRoot: PathSegmentStub({ value: '/project' }) });
 * // Creates .agents/plugins/dungeonmaster/plugin.json and mcp_config.json
 */

import {
  fileContentsContract,
  pathSegmentContract,
  type AdapterResult,
  type PathSegment,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics, mcpToolsStatics } from '@dungeonmaster/shared/statics';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { dungeonmasterConfigCreatorTransformer } from '../../../transformers/dungeonmaster-config-creator/dungeonmaster-config-creator-transformer';

const JSON_INDENT_SPACES = 2;

export const agentsPluginCreateBroker = async ({
  targetProjectRoot,
}: {
  targetProjectRoot: PathSegment;
}): Promise<AdapterResult> => {
  const pluginDir = pathSegmentContract.parse(
    pathJoinAdapter({
      paths: [
        targetProjectRoot,
        locationsStatics.repoRoot.agents.dir,
        locationsStatics.repoRoot.agents.pluginsDir,
        mcpToolsStatics.server.name,
      ],
    }),
  );

  await fsMkdirAdapter({ filepath: pluginDir });

  const pluginJsonPath = pathSegmentContract.parse(
    pathJoinAdapter({ paths: [pluginDir, locationsStatics.repoRoot.agents.pluginJson] }),
  );
  const mcpConfigJsonPath = pathSegmentContract.parse(
    pathJoinAdapter({ paths: [pluginDir, locationsStatics.repoRoot.agents.mcpConfigJson] }),
  );

  const pluginJsonContent = fileContentsContract.parse(
    JSON.stringify(
      {
        name: mcpToolsStatics.server.name,
      },
      null,
      JSON_INDENT_SPACES,
    ),
  );

  const rawMcpConfig = dungeonmasterConfigCreatorTransformer();
  const [serverConfig] = Object.values(rawMcpConfig);

  const mcpConfigContent = fileContentsContract.parse(
    JSON.stringify(
      {
        mcpServers: {
          dungeonmaster: {
            command: serverConfig?.command,
            args: serverConfig?.args,
          },
        },
      },
      null,
      JSON_INDENT_SPACES,
    ),
  );

  await fsWriteFileAdapter({ filepath: pluginJsonPath, contents: pluginJsonContent });
  await fsWriteFileAdapter({ filepath: mcpConfigJsonPath, contents: mcpConfigContent });

  return { success: true };
};
