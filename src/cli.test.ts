import { detectCommand } from './cli';

describe('CLI', () => {
  describe('detectCommand', () => {
    it('should detect list command', () => {
      const command = detectCommand('list');
      expect(command.type).toBe('list');
    });

    it('should detect abandon command', () => {
      const command = detectCommand('abandon');
      expect(command.type).toBe('abandon');
    });

    it('should detect start command with arguments', () => {
      const command = detectCommand('start auth-quest');
      expect(command.type).toBe('start');
      expect(command.args).toEqual(['auth-quest']);
    });

    it('should detect clean command', () => {
      const command = detectCommand('clean');
      expect(command.type).toBe('clean');
    });

    it('should default to create/resume for unknown commands', () => {
      const command = detectCommand('add authentication');
      expect(command.type).toBe('default');
      expect(command.args).toEqual(['add authentication']);
    });

    it('should handle empty input', () => {
      const command = detectCommand('');
      expect(command.type).toBe('default');
      expect(command.args).toEqual([]);
    });

    it('should handle mixed case commands', () => {
      const command = detectCommand('LIST');
      expect(command.type).toBe('list');
    });

    it('should handle commands with multiple arguments', () => {
      const command = detectCommand('start my awesome quest');
      expect(command.type).toBe('start');
      expect(command.args).toEqual(['my', 'awesome', 'quest']);
    });
  });
});
