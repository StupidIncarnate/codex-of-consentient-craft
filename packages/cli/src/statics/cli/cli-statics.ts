/**
 * PURPOSE: Defines immutable CLI configuration values and command names
 *
 * USAGE:
 * cliStatics.commands.help;
 * // Returns 'help' command name
 */

export const cliStatics = {
  commands: {
    help: 'help',
    list: 'list',
  },
  meta: {
    name: 'dungeonmaster',
    description: 'Dungeonmaster Quest CLI',
    version: '0.1.0',
  },
  messages: {
    noQuests: 'No active quests found.',
    noQuestsFolder: 'No .dungeonmaster-quests folder found in project.',
    loading: 'Loading quests...',
  },
} as const;
