/**
 * PURPOSE: Sets up E2E test configuration files for CLI integration testing
 *
 * USAGE:
 * e2eConfigSetupBroker({ projectPath: '/tmp/test', dungeonmasterPath: '/path/to/repo' });
 * // Creates .mcp.json, .claude/settings.json, and .dungeonmaster config files
 */

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fileContentContract } from '../../../contracts/file-content/file-content-contract';

const JSON_INDENT = 2;

export const e2eConfigSetupBroker = ({
  projectPath,
  dungeonmasterPath,
}: {
  projectPath: string;
  dungeonmasterPath: string;
}): void => {
  // Create .mcp.json with MCP server config pointing to source
  const mcpConfig = {
    mcpServers: {
      dungeonmaster: {
        type: 'stdio',
        command: 'npx',
        args: ['tsx', pathJoinAdapter({ paths: [dungeonmasterPath, 'packages/mcp/src/index.ts'] })],
      },
    },
  };
  fsWriteFileAdapter({
    filePath: pathJoinAdapter({ paths: [projectPath, '.mcp.json'] }),
    content: fileContentContract.parse(JSON.stringify(mcpConfig, null, JSON_INDENT)),
  });

  // Create .claude/settings.json with permissions
  const claudeDir = pathJoinAdapter({ paths: [projectPath, '.claude'] });
  if (!fsExistsAdapter({ filePath: claudeDir })) {
    fsMkdirAdapter({ dirPath: claudeDir, recursive: true });
  }
  const claudeSettings = {
    permissions: {
      allow: ['mcp__dungeonmaster__*', 'Bash(npx tsx:*)'],
      deny: [],
    },
  };
  fsWriteFileAdapter({
    filePath: pathJoinAdapter({ paths: [claudeDir, 'settings.json'] }),
    content: fileContentContract.parse(JSON.stringify(claudeSettings, null, JSON_INDENT)),
  });

  // Create .dungeonmaster config file
  const dungeonmasterConfig = {
    questFolder: '.dungeonmaster-quests',
    wardCommands: {},
  };
  fsWriteFileAdapter({
    filePath: pathJoinAdapter({ paths: [projectPath, '.dungeonmaster'] }),
    content: fileContentContract.parse(JSON.stringify(dungeonmasterConfig, null, JSON_INDENT)),
  });
};
