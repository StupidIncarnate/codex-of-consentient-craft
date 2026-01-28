import { terminalFrameContract } from './terminal-frame-contract';
import { TerminalFrameStub } from './terminal-frame.stub';

describe('terminalFrameContract', () => {
  describe('valid terminal frames', () => {
    it('VALID: {any string} => parses successfully', () => {
      const frame = TerminalFrameStub({ value: 'Simple content' });

      const result = terminalFrameContract.parse(frame);

      expect(result).toBe('Simple content');
    });

    it('VALID: {default stub} => parses successfully', () => {
      const frame = TerminalFrameStub();

      const result = terminalFrameContract.parse(frame);

      expect(result).toBe('┌─────────┐\n│ Content │\n└─────────┘');
    });

    it('VALID: {empty string} => parses successfully', () => {
      const frame = TerminalFrameStub({ value: '' });

      const result = terminalFrameContract.parse(frame);

      expect(result).toBe('');
    });
  });
});
