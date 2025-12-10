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
import { filePathContract } from '@dungeonmaster/shared/contracts';

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

  process.stdout.write(`${cliStatics.meta.name}\n`);
  process.stdout.write(`${cliStatics.meta.description}\n`);
  process.stdout.write(`\n`);
  process.stdout.write(`Commands:\n`);
  process.stdout.write(`  help   Show this help message\n`);
  process.stdout.write(`  list   List all active quests\n`);
};

if (require.main === module) {
  StartCli().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  });
}
