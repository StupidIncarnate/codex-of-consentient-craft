import { cliStatics } from './cli-statics';

describe('cliStatics', () => {
  describe('commands', () => {
    it('VALID: help command => returns help', () => {
      expect(cliStatics.commands.help).toBe('help');
    });

    it('VALID: list command => returns list', () => {
      expect(cliStatics.commands.list).toBe('list');
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
});
