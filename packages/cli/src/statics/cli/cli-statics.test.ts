import { cliStatics } from './cli-statics';

describe('cliStatics', () => {
  describe('commands', () => {
    it('VALID: help command => returns help', () => {
      expect(cliStatics.commands.help).toBe('help');
    });

    it('VALID: list command => returns list', () => {
      expect(cliStatics.commands.list).toBe('list');
    });

    it('VALID: init command => returns init', () => {
      expect(cliStatics.commands.init).toBe('init');
    });

    it('VALID: run command => returns run', () => {
      expect(cliStatics.commands.run).toBe('run');
    });

    it('VALID: claude command => returns claude', () => {
      expect(cliStatics.commands.claude).toBe('claude');
    });

    it('VALID: debug command => returns debug', () => {
      expect(cliStatics.commands.debug).toBe('debug');
    });
  });

  describe('meta', () => {
    it('VALID: name => returns dungeonmaster', () => {
      expect(cliStatics.meta.name).toBe('dungeonmaster');
    });

    it('VALID: description => returns description string', () => {
      expect(cliStatics.meta.description).toBe('Dungeonmaster Quest CLI');
    });

    it('VALID: version => returns version string', () => {
      expect(cliStatics.meta.version).toBe('0.1.0');
    });
  });

  describe('messages', () => {
    it('VALID: noQuests => returns message', () => {
      expect(cliStatics.messages.noQuests).toBe('No active quests found.');
    });

    it('VALID: noQuestsFolder => returns message', () => {
      expect(cliStatics.messages.noQuestsFolder).toBe(
        'No .dungeonmaster-quests folder found in project.',
      );
    });

    it('VALID: loading => returns message', () => {
      expect(cliStatics.messages.loading).toBe('Loading quests...');
    });
  });

  describe('menu', () => {
    it('VALID: options => returns array of menu options', () => {
      expect(cliStatics.menu.options).toStrictEqual([
        { id: 'run', label: 'Run', description: 'Run an existing quest' },
        { id: 'list', label: 'List', description: 'List all active quests' },
        { id: 'init', label: 'Init', description: 'Initialize dungeonmaster in project' },
      ]);
    });
  });

  describe('testing', () => {
    it('VALID: useEffectDelayMs => returns delay value', () => {
      expect(cliStatics.testing.useEffectDelayMs).toBe(10);
    });
  });
});
