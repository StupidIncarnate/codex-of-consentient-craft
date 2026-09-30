/**
 * PURPOSE: Creates and manages temporary test projects for integration testing
 *
 * USAGE:
 * const testProject = integrationEnvironmentCreateBroker({
 *   baseName: 'my-test',
 *   options: { createPackageJson: true, setupEslint: true }
 * });
 * testProject.writeFile({ fileName: 'src/index.ts', content: 'export const foo = 42;' });
 * const result = testProject.executeCommand({ command: 'npm test' });
 * const installOutput = await testProject.installDungeonmaster();
 * testProject.cleanup();
 * // Creates isolated test environment in /tmp with automatic cleanup tracking
 *
 * IMPORTANT: Files in /tmp are outside the TypeScript project, so:
 * - ✅ Works great for: CLI tools, file operations, command execution
 * - ✅ Works for: ESLint RuleTester (uses synthetic code, not real files)
 * - ❌ Won't work for: Running ESLint with type-aware rules on test files
 *   (type-aware rules need files in tsconfig.json include paths)
 */

import {
  ensureDirSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';
import { runSync } from '#gateway/node/child_process';
import { runScript } from '#gateway/bin/npm';
import { randomBytes } from '#gateway/node/crypto';
import { execResultContract } from '@dungeonmaster/shared/contracts';
import { testGuildContract } from '../../../contracts/test-guild/test-guild-contract';
import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';
import { integrationEnvironmentStatics } from '../../../statics/integration-environment/integration-environment-statics';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { ExecResult } from '@dungeonmaster/shared/contracts';
import type { PackageJson } from '../../../contracts/package-json/package-json-contract';
import type { TestbedConfig } from '../../../contracts/testbed-config/testbed-config-contract';
import type { TestGuild } from '../../../contracts/test-guild/test-guild-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { testbedConfigContract } from '../../../contracts/testbed-config/testbed-config-contract';

export const integrationEnvironmentCreateBroker = ({
  baseName,
  options,
}: {
  baseName: string;
  options?: {
    createPackageJson?: boolean;
    setupEslint?: boolean; // Copy tsconfig/eslint from project for type-aware linting
  };
}): TestGuild => {
  const testId = randomBytes(integrationEnvironmentStatics.constants.randomBytesLength).toString(
    'hex',
  );
  const projectName = `${baseName}-${testId}`;
  // Use /tmp to keep test artifacts out of the repo
  // Most integration tests don't need ESLint to run on test files
  const { baseDir } = integrationEnvironmentStatics.paths;
  const projectPath = join(baseDir, projectName);

  // Create project directory
  if (!existsSync(projectPath)) {
    ensureDirSync(projectPath);
  }

  // Create basic package.json (optional)
  if (options?.createPackageJson !== false) {
    const packageJson = {
      name: projectName,
      version: integrationEnvironmentStatics.packageJson.version,
      scripts: integrationEnvironmentStatics.packageJson.scripts,
    };

    writeFileSync(
      join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, integrationEnvironmentStatics.constants.jsonIndentSpaces),
    );
  }

  // Setup ESLint support (optional) - creates tsconfig and eslint config
  // This allows ESLint with type-aware rules to work on files in /tmp
  if (options?.setupEslint === true) {
    // Create a minimal tsconfig.json that includes all files in this test env
    const { tsconfig } = integrationEnvironmentStatics;
    writeFileSync(
      join(projectPath, locationsStatics.repoRoot.tsconfig),
      JSON.stringify(tsconfig, null, integrationEnvironmentStatics.constants.jsonIndentSpaces),
    );

    // Always create a minimal eslint config that uses the local tsconfig
    // This allows type-aware ESLint rules to work on files in /tmp
    writeFileSync(
      join(projectPath, locationsStatics.repoRoot.eslintConfig[1]),
      integrationEnvironmentStatics.eslintConfig.template,
    );
  }

  const testProject: TestGuild = {
    ...testGuildContract.parse({
      guildPath: testGuildContract.shape.guildPath.parse(projectPath),
      guildName: testGuildContract.shape.guildName.parse(projectName),
      rootDir: testGuildContract.shape.rootDir.parse(projectPath),
    }),

    installDungeonmaster: async (): Promise<string> => {
      try {
        const { output } = await runScript({ cwd: projectPath, script: 'install-dungeonmaster' });
        return output;
      } catch (error) {
        const output = error instanceof Error ? error.message : 'Installation failed';
        return output;
      }
    },

    hasCommand: ({ command }: { command: string }): boolean => {
      const packageJsonPath = join(projectPath, 'package.json');
      if (!existsSync(packageJsonPath)) {
        return false;
      }

      const packageJson = packageJsonContract.parse(JSON.parse(readFileSync(packageJsonPath)));
      return Object.entries(packageJson.scripts).some(
        ([key, value]) => key === command && Boolean(value),
      );
    },

    fileExists: ({ fileName }: { fileName: string }): boolean =>
      existsSync(join(projectPath, fileName)),

    readFile: ({ fileName }: { fileName: string }): string => {
      const content = readFileSync(join(projectPath, fileName));
      return content;
    },

    writeFile: ({ fileName, content }: { fileName: string; content: string }): void => {
      const filePath = join(projectPath, fileName);
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        ensureDirSync(dir);
      }
      writeFileSync(filePath, content);
    },

    deleteFile: ({ fileName }: { fileName: string }): void => {
      const filePath = join(projectPath, fileName);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    },

    getConfig: (): TestbedConfig | null => {
      const configPath = join(projectPath, locationsStatics.dungeonmasterHome.dir);
      if (!existsSync(configPath)) {
        return null;
      }
      return testbedConfigContract.parse(JSON.parse(readFileSync(configPath)));
    },

    getPackageJson: (): PackageJson => {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = readFileSync(packageJsonPath);
      return packageJsonContract.parse(JSON.parse(content));
    },

    getQuestFiles: ({ subdir }: { subdir?: string }): string[] => {
      const questDir = subdir
        ? join(projectPath, 'dungeonmaster', subdir)
        : join(projectPath, 'dungeonmaster');

      if (!existsSync(questDir)) {
        return [];
      }

      const extension = subdir ? '.json' : '.md';
      const basePath = subdir ? join('dungeonmaster', subdir) : 'dungeonmaster';

      return readdirSync(questDir)
        .filter((file) => file.endsWith(extension))
        .map((file) => join(basePath, file));
    },

    executeCommand: ({ command }: { command: string }): ExecResult => {
      try {
        // A shell, because a CommandName is a whole command line that may carry pipes or `&&`.
        // runSync folds stderr into `output`, so a failed run reports it whole as stderr.
        const { exitCode, output } = runSync({
          command: 'sh',
          args: ['-c', command],
          cwd: projectPath,
        });
        return execResultContract.parse({
          stdout: exitCode === 0 ? output : '',
          stderr: exitCode === 0 ? '' : output,
          exitCode,
        });
      } catch (error) {
        const stderr = error instanceof Error ? error.message : 'Unknown error';
        return execResultContract.parse({ stdout: '', stderr, exitCode: 1 });
      }
    },

    cleanup: (): void => {
      if (existsSync(projectPath)) {
        rmSync(projectPath, { recursive: true, force: true });
      }
    },
  };

  // Track for automatic cleanup
  integrationEnvironmentTrackingBroker.add({ guild: testProject });

  return testProject;
};
