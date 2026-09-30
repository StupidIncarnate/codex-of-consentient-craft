/**
 * PURPOSE: Scaffolds the Antigravity plugin for dungeonmaster (.agents/plugins/dungeonmaster/)
 * containing plugin.json and mcp_config.json so Antigravity discovers the dungeonmaster MCP server
 *
 * USAGE:
 * await agentsPluginCreateBroker({ targetProjectRoot: PathSegmentStub({ value: '/project' }) });
 * // Creates .agents/plugins/dungeonmaster/plugin.json and mcp_config.json
 */

import { locationsStatics, mcpToolsStatics } from '@dungeonmaster/shared/statics';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { dungeonmasterConfigCreatorTransformer } from '../../../transformers/dungeonmaster-config-creator/dungeonmaster-config-creator-transformer';

export const agentsPluginCreateBroker = async ({
  targetProjectRoot,
}: {
  targetProjectRoot: string;
}): Promise<void> => {
  const pluginDir = join(
    targetProjectRoot,
    locationsStatics.repoRoot.agents.dir,
    locationsStatics.repoRoot.agents.pluginsDir,
    mcpToolsStatics.server.name,
  );

  await ensureDir(pluginDir);

  const pluginJsonPath = join(pluginDir, locationsStatics.repoRoot.agents.pluginJson);
  const mcpConfigJsonPath = join(pluginDir, locationsStatics.repoRoot.agents.mcpConfigJson);

  const pluginJsonContent = jsonFileContentsTransformer({
    value: {
      name: mcpToolsStatics.server.name,
    },
  });

  const rawMcpConfig = dungeonmasterConfigCreatorTransformer();
  const [serverConfig] = Object.values(rawMcpConfig);

  const mcpConfigContent = jsonFileContentsTransformer({
    value: {
      mcpServers: {
        dungeonmaster: {
          command: serverConfig?.command,
          args: serverConfig?.args,
        },
      },
    },
  });

  await writeFile(pluginJsonPath, pluginJsonContent);
  await writeFile(mcpConfigJsonPath, mcpConfigContent);
};
