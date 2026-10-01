import { terminalTextCleanTransformer } from './terminal-text-clean-transformer';

describe('terminalTextCleanTransformer', () => {
  describe('plain text', () => {
    it('VALID: {text: one plain line} => returns it unchanged', () => {
      const result = terminalTextCleanTransformer({ text: '— base branch: master —' });

      expect(result).toBe('— base branch: master —');
    });

    it('VALID: {text: two lines with a trailing newline} => returns both lines, no trailing break', () => {
      const result = terminalTextCleanTransformer({ text: 'first\nsecond\n' });

      expect(result).toBe('first\nsecond');
    });
  });

  describe('ward progress redraws', () => {
    it('VALID: {text: running line overwritten by its result} => returns both as their own lines', () => {
      const result = terminalTextCleanTransformer({
        text: 'unit        @dungeonmaster/eslint-plugin running...\r\u001b[Klint        @dungeonmaster/orchestrator PASS  60 files, 60 discovered (21.6s)\n',
      });

      expect(result).toBe(
        'unit        @dungeonmaster/eslint-plugin running...\nlint        @dungeonmaster/orchestrator PASS  60 files, 60 discovered (21.6s)',
      );
    });

    it('VALID: {text: a carve log as streamLines joins it} => returns only the real lines', () => {
      const result = terminalTextCleanTransformer({
        text: 'typecheck   @dungeonmaster/cli   running...\r\n\u001b[Ktypecheck   @dungeonmaster/config FAIL  67 files, 42 errors, 67 discovered (8.7s)\n\n\r\u001b[K\n\n\u001b[Ktypecheck   @dungeonmaster/cli   FAIL  183 files, 122 errors, 183 discovered (9.2s)\n',
      });

      expect(result).toBe(
        'typecheck   @dungeonmaster/cli   running...\ntypecheck   @dungeonmaster/config FAIL  67 files, 42 errors, 67 discovered (8.7s)\ntypecheck   @dungeonmaster/cli   FAIL  183 files, 122 errors, 183 discovered (9.2s)',
      );
    });

    it('EMPTY: {text: only an erase-line redraw} => returns empty string', () => {
      const result = terminalTextCleanTransformer({ text: '\r\u001b[K\n' });

      expect(result).toBe('');
    });
  });

  describe('other escape sequences', () => {
    it('VALID: {text: colour codes} => returns the text without them', () => {
      const result = terminalTextCleanTransformer({ text: '\u001b[31mFAIL\u001b[0m lint' });

      expect(result).toBe('FAIL lint');
    });

    it('VALID: {text: an OSC title sequence ended by BEL} => returns the text without it', () => {
      const result = terminalTextCleanTransformer({ text: '\u001b]0;ward\u0007done' });

      expect(result).toBe('done');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {text: ""} => returns empty string', () => {
      const result = terminalTextCleanTransformer({ text: '' });

      expect(result).toBe('');
    });
  });
});
