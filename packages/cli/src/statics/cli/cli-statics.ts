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
    init: 'init',
    add: 'add',
    claude: 'claude',
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
    addPrompt: 'What would you like to build?',
  },
  menu: {
    options: [
      { id: 'add', label: 'Add', description: 'Add a new quest' },
      { id: 'list', label: 'List', description: 'List all active quests' },
      { id: 'init', label: 'Init', description: 'Initialize dungeonmaster in project' },
    ],
  },
  testing: {
    useEffectDelayMs: 10,
  },
} as const;
