/**
 * PURPOSE: MCP configuration helpers for E2E tests
 * USAGE: Used by createE2ETestProject to set up MCP for test CLI instances
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

export interface McpServerConfig {
  type?: 'stdio';
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

/**
 * Returns the absolute path to the MCP server entry point
 */
const getMcpServerPath = (): string => {
  return resolve(__dirname, '../../../packages/mcp/src/index.ts');
};

/**
 * Returns the default MCP configuration for E2E tests
 * @param projectDir - The project directory to use for quest file operations
 */
export const getDefaultMcpConfig = (projectDir?: string): McpConfig => ({
  mcpServers: {
    dungeonmaster: {
      type: 'stdio',
      command: 'npx',
      args: ['tsx', getMcpServerPath()],
      env: projectDir ? { DUNGEONMASTER_PROJECT_DIR: projectDir } : {},
    },
  },
});

/**
 * Writes MCP configuration to a test project directory
 */
export const writeMcpConfig = (
  projectDir: string,
  config?: McpConfig,
): void => {
  const mcpConfig = config ?? getDefaultMcpConfig(projectDir);
  writeFileSync(
    join(projectDir, '.mcp.json'),
    JSON.stringify(mcpConfig, null, 2),
  );
};

/**
 * Writes Claude settings with MCP permissions to a test project directory
 */
export const writeClaudeSettings = (projectDir: string): void => {
  const claudeDir = join(projectDir, '.claude');
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }

  const settings = {
    permissions: {
      allow: [
        'mcp__dungeonmaster__*',
        'mcp__dungeonmaster__add-quest',
        'mcp__dungeonmaster__get-quest',
        'mcp__dungeonmaster__modify-quest',
        'mcp__dungeonmaster__signal-back',
        'mcp__dungeonmaster__discover',
        'mcp__dungeonmaster__get-architecture',
        'mcp__dungeonmaster__get-folder-detail',
        'mcp__dungeonmaster__get-syntax-rules',
        'mcp__dungeonmaster__get-testing-patterns',
      ],
      deny: [],
    },
    enableAllProjectMcpServers: true,
  };

  writeFileSync(
    join(claudeDir, 'settings.json'),
    JSON.stringify(settings, null, 2),
  );
};
