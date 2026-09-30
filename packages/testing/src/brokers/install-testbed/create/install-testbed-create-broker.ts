/**
 * PURPOSE: Creates and manages temporary test environments for integration testing the install system
 *
 * USAGE:
 * const testbed = installTestbedCreateBroker({ baseName: 'my-test' });
 * testbed.writeFile({ relativePath: '.claude/settings.json', content: '{}' });
 * const result = testbed.runInitCommand();
 * const settings = testbed.getClaudeSettings();
 * testbed.cleanup();
 * // Creates isolated test environment with pre-install requirements satisfied
 */

import {
  ensureDirSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';
import { runSync } from '#gateway/node/child_process';
import { randomBytes } from '#gateway/node/crypto';
import { installTestbedContract } from '../../../contracts/install-testbed/install-testbed-contract';
import { claudeSettingsContract } from '../../../contracts/claude-settings/claude-settings-contract';
import type { ClaudeSettings } from '../../../contracts/claude-settings/claude-settings-contract';
import { mcpConfigContract } from '../../../contracts/mcp-config/mcp-config-contract';
import type { McpConfig } from '../../../contracts/mcp-config/mcp-config-contract';
import { testbedConfigContract } from '../../../contracts/testbed-config/testbed-config-contract';
import { integrationEnvironmentStatics } from '../../../statics/integration-environment/integration-environment-statics';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { findRepoRootLayerBroker } from './find-repo-root-layer-broker';
import type { InstallTestbed } from '../../../contracts/install-testbed/install-testbed-contract';
import type { TestbedConfig } from '../../../contracts/testbed-config/testbed-config-contract';

export const installTestbedCreateBroker = ({
  baseName,
  baseDir,
}: {
  baseName: string;
  baseDir?: string;
}): InstallTestbed => {
  const testId = randomBytes(integrationEnvironmentStatics.constants.randomBytesLength).toString(
    'hex',
  );
  const projectName = `${baseName}-${testId}`;
  const resolvedBaseDir = baseDir ?? integrationEnvironmentStatics.paths.baseDir;
  const projectPath = join(resolvedBaseDir, projectName);

  // Create project directory
  if (!existsSync(projectPath)) {
    ensureDirSync(projectPath);
  }

  // Create package.json to satisfy pre-install validation
  const packageJson = {
    name: projectName,
    version: integrationEnvironmentStatics.packageJson.version,
  };

  writeFileSync(
    join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, integrationEnvironmentStatics.constants.jsonIndentSpaces),
  );

  // Create .claude directory to satisfy pre-install validation
  const claudeDir = join(projectPath, locationsStatics.repoRoot.claude.dir);
  if (!existsSync(claudeDir)) {
    ensureDirSync(claudeDir);
  }

  // Walk up from __dirname to the nearest package.json with a `workspaces` field — correct
  // whether this package resolves to dist/src/... (published/runtime) or src/... directly
  // (ts-jest, --conditions=source), unlike a fixed hop count off __dirname.
  const dungeonmasterPath = findRepoRootLayerBroker({
    startPath: __dirname,
  });

  const testbed: InstallTestbed = {
    ...installTestbedContract.parse({
      guildPath: installTestbedContract.shape.guildPath.parse(projectPath),
      dungeonmasterPath: installTestbedContract.shape.dungeonmasterPath.parse(dungeonmasterPath),
    }),

    cleanup: (): void => {
      if (existsSync(projectPath)) {
        rmSync(projectPath, { recursive: true, force: true });
      }
    },

    writeFile: ({
      relativePath,
      content,
    }: {
      relativePath: string;
      content: string;
    }): void => {
      const fullPath = join(projectPath, relativePath);
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        ensureDirSync(dir);
      }
      writeFileSync(fullPath, content);
    },

    readFile: ({ relativePath }: { relativePath: string }): string | null => {
      const fullPath = join(projectPath, relativePath);
      if (!existsSync(fullPath)) {
        return null;
      }
      const content = readFileSync(fullPath);
      return content;
    },

    createSymlink: ({
      relativePath,
      targetPath,
    }: {
      relativePath: string;
      targetPath: string;
    }): void => {
      const fullPath = join(projectPath, relativePath);
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        ensureDirSync(dir);
      }
      symlinkSync({ target: targetPath, path: fullPath, type: 'dir' });
    },

    listDir: ({ relativePath }: { relativePath: string }): readonly string[] | null => {
      const fullPath = join(projectPath, relativePath);
      if (!existsSync(fullPath)) {
        return null;
      }
      return readdirSync(fullPath)
        .map((entry) => entry)
        .sort();
    },

    getClaudeSettings: (): ClaudeSettings | null => {
      const settingsPath = join(
        projectPath,
        locationsStatics.repoRoot.claude.dir,
        locationsStatics.repoRoot.claude.settings,
      );
      if (!existsSync(settingsPath)) {
        return null;
      }
      const content = readFileSync(settingsPath);
      return claudeSettingsContract.parse(JSON.parse(content));
    },

    getMcpConfig: (): McpConfig | null => {
      const mcpPath = join(projectPath, locationsStatics.repoRoot.mcpJson);
      if (!existsSync(mcpPath)) {
        return null;
      }
      const content = readFileSync(mcpPath);
      return mcpConfigContract.parse(JSON.parse(content));
    },

    getDungeonmasterConfig: (): TestbedConfig | null => {
      const configPath = join(projectPath, locationsStatics.dungeonmasterHome.dir);
      if (!existsSync(configPath)) {
        return null;
      }
      const content = readFileSync(configPath);
      return testbedConfigContract.parse(JSON.parse(content));
    },

    getEslintConfig: (): string | null => {
      const eslintPath = join(projectPath, locationsStatics.repoRoot.eslintConfig[1]);
      if (!existsSync(eslintPath)) {
        return null;
      }
      const content = readFileSync(eslintPath);
      return content;
    },

    runInitCommand: (): ReturnType<InstallTestbed['runInitCommand']> => {
      try {
        const { exitCode, output } = runSync({
          command: 'dungeonmaster',
          args: ['init'],
          cwd: projectPath,
        });
        // runSync folds stderr into `output`, so a failed run reports it whole as stderr.
        return {
          exitCode: exitCode,
          stdout: (exitCode === 0 ? output : ''),
          stderr: (exitCode === 0 ? '' : output),
        };
      } catch (error) {
        const stderr = error instanceof Error ? error.message : 'Unknown error';
        return {
          exitCode: 1,
          stdout: '',
          stderr: stderr,
        };
      }
    },
  };

  return testbed;
};
