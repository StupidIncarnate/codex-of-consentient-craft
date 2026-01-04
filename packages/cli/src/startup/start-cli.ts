#!/usr/bin/env node

/**
 * PURPOSE: CLI entry point that handles help and list commands
 *
 * USAGE:
 * await StartCli();
 * // Or via CLI: dungeonmaster help | dungeonmaster list
 */

import { questListBroker } from '../brokers/quest/list/quest-list-broker';
import { questToListItemTransformer } from '../transformers/quest-to-list-item/quest-to-list-item-transformer';
import { cliStatics } from '../statics/cli/cli-statics';
import { agentSpawnBroker } from '../brokers/agent/spawn/agent-spawn-broker';
import {
  filePathContract,
  userInputContract,
  installContextContract,
} from '@dungeonmaster/shared/contracts';
import { installCheckBroker } from '@dungeonmaster/shared/brokers';
import { packageDiscoverBroker } from '../brokers/package/discover/package-discover-broker';
import { installOrchestrateBroker } from '../brokers/install/orchestrate/install-orchestrate-broker';
import { pathDirnameAdapter } from '@dungeonmaster/shared/adapters';

const COMMAND_LINE_ARG_START_INDEX = 2;

export const StartCli = async (): Promise<void> => {
  const args = process.argv.slice(COMMAND_LINE_ARG_START_INDEX);
  const command = args[0] ?? cliStatics.commands.help;

  if (command === cliStatics.commands.help) {
    process.stdout.write(`${cliStatics.meta.name}\n`);
    process.stdout.write(`${cliStatics.meta.description}\n`);
    process.stdout.write(`\n`);
    process.stdout.write(`Commands:\n`);
    process.stdout.write(`  help   Show this help message\n`);
    process.stdout.write(`  list   List all active quests\n`);
    process.stdout.write(`  init   Initialize dungeonmaster in project\n`);
    return;
  }

  if (command === cliStatics.commands.init) {
    try {
      const projectRoot = filePathContract.parse(process.cwd());

      const validationResult = installCheckBroker({ projectRoot });
      if (!validationResult.valid) {
        process.stderr.write(`Error: ${validationResult.error}\n`);
        process.exit(1);
      }

      // From dist/startup/ go up 4 levels to reach monorepo root:
      // dist/startup → dist → cli → packages → monorepo-root
      const dungeonmasterRoot = pathDirnameAdapter({
        path: pathDirnameAdapter({
          path: pathDirnameAdapter({
            path: pathDirnameAdapter({ path: filePathContract.parse(__dirname) }),
          }),
        }),
      });

      process.stdout.write(`Discovering packages...\n`);
      const packages = packageDiscoverBroker({ dungeonmasterRoot });

      if (packages.length === 0) {
        process.stdout.write(`No packages with install scripts found.\n`);
        return;
      }

      process.stdout.write(`Found ${packages.length} package(s) to install.\n`);

      const context = installContextContract.parse({
        targetProjectRoot: projectRoot,
        dungeonmasterRoot,
      });

      const results = await installOrchestrateBroker({ packages, context });

      process.stdout.write(`\nInstallation Results:\n`);
      for (const result of results) {
        const status = result.success ? '\u2713' : '\u2717';
        process.stdout.write(`  ${status} ${result.packageName} - ${result.action}\n`);
        if (result.message) {
          process.stdout.write(`    ${result.message}\n`);
        }
        if (result.error) {
          process.stdout.write(`    Error: ${result.error}\n`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error during init: ${errorMessage}\n`);
      process.exit(1);
    }
    return;
  }

  if (command === cliStatics.commands.list) {
    try {
      const cwd = filePathContract.parse(process.cwd());
      const quests = await questListBroker({ startPath: cwd });

      if (quests.length === 0) {
        process.stdout.write(`${cliStatics.messages.noQuests}\n`);
        return;
      }

      process.stdout.write(`Active Quests:\n\n`);

      for (const quest of quests) {
        const item = questToListItemTransformer({ quest });
        process.stdout.write(`${item.title} (${item.status})\n`);
        if (item.currentPhase) {
          process.stdout.write(`  Phase: ${item.currentPhase}\n`);
        }
        if (item.taskProgress) {
          process.stdout.write(`  Progress: ${item.taskProgress}\n`);
        }
        process.stdout.write(`\n`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('.dungeonmaster-quests')) {
        process.stdout.write(`${cliStatics.messages.noQuestsFolder}\n`);
        return;
      }

      process.stderr.write(`Error: ${errorMessage}\n`);
    }
    return;
  }

  // If not a known command, treat as quest request and spawn agent
  const userInput = args.join(' ');
  if (userInput.trim()) {
    try {
      await agentSpawnBroker({ userInput: userInputContract.parse(userInput) });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error spawning agent: ${errorMessage}\n`);
      process.exit(1);
    }
    return;
  }

  // If empty input, show help
  process.stdout.write(`${cliStatics.meta.name}\n`);
  process.stdout.write(`${cliStatics.meta.description}\n`);
  process.stdout.write(`\n`);
  process.stdout.write(`Commands:\n`);
  process.stdout.write(`  help   Show this help message\n`);
  process.stdout.write(`  list   List all active quests\n`);
  process.stdout.write(`  init   Initialize dungeonmaster in project\n`);
};

if (require.main === module) {
  StartCli().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  });
}
