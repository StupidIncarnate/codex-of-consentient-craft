import { ptyTerminalNameContract } from './pty-terminal-name-contract';
import { PtyTerminalNameStub } from './pty-terminal-name.stub';

describe('ptyTerminalNameContract', () => {
  describe('valid terminal names', () => {
    it('VALID: {value: "xterm-256color"} => parses default terminal name', () => {
      const termName = PtyTerminalNameStub({ value: 'xterm-256color' });

      const result = ptyTerminalNameContract.parse(termName);

      expect(result).toBe('xterm-256color');
    });

    it('VALID: {value: "xterm"} => parses basic xterm', () => {
      const termName = PtyTerminalNameStub({ value: 'xterm' });

      const result = ptyTerminalNameContract.parse(termName);

      expect(result).toBe('xterm');
    });

    it('VALID: {value: "dumb"} => parses dumb terminal', () => {
      const termName = PtyTerminalNameStub({ value: 'dumb' });

      const result = ptyTerminalNameContract.parse(termName);

      expect(result).toBe('dumb');
    });
  });

  describe('invalid terminal names', () => {
    it('INVALID_TERMINAL_NAME: {value: 123} => throws validation error for number', () => {
      expect(() => {
        return ptyTerminalNameContract.parse(123 as never);
      }).toThrow(/string/iu);
    });
  });
});
