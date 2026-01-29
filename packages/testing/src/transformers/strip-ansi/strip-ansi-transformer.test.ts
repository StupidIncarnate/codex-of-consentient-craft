import { stripAnsiTransformer } from './strip-ansi-transformer';
import { ScreenFrameStub } from '../../contracts/screen-frame/screen-frame.stub';

describe('stripAnsiTransformer', () => {
  describe('ANSI escape sequences', () => {
    it('VALID: {frame with cursor hide sequence} => returns frame without escape code', () => {
      const frame = ScreenFrameStub({ value: '\u001B[?25lHello World' });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('Hello World');
    });

    it('VALID: {frame with cursor show sequence} => returns frame without escape code', () => {
      const frame = ScreenFrameStub({ value: '\u001B[?25hHello World' });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('Hello World');
    });

    it('VALID: {frame with color codes} => returns frame without color codes', () => {
      const frame = ScreenFrameStub({ value: '\u001B[31mRed Text\u001B[0m' });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('Red Text');
    });

    it('VALID: {frame with multiple escape sequences} => returns clean text', () => {
      const frame = ScreenFrameStub({
        value: '\u001B[?25l\u001B[32mGreen\u001B[0m and \u001B[34mBlue\u001B[0m\u001B[?25h',
      });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('Green and Blue');
    });

    it('VALID: {frame with cursor movement} => returns frame without movement codes', () => {
      const frame = ScreenFrameStub({ value: '\u001B[2AHello\u001B[1B' });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('Hello');
    });

    it('VALID: {frame with clear screen} => returns frame without clear code', () => {
      const frame = ScreenFrameStub({ value: '\u001B[2JContent' });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('Content');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {frame with no ANSI codes} => returns unchanged frame', () => {
      const frame = ScreenFrameStub({ value: 'Plain text with ? and other chars' });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('Plain text with ? and other chars');
    });

    it('EDGE: {empty frame} => returns empty frame', () => {
      const frame = ScreenFrameStub({ value: '' });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('');
    });

    it('EDGE: {frame with question mark but no ANSI} => preserves question mark', () => {
      const frame = ScreenFrameStub({ value: 'What is your name?' });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('What is your name?');
    });

    it('EDGE: {frame with only ANSI codes} => returns empty string', () => {
      const frame = ScreenFrameStub({ value: '\u001B[?25l\u001B[0m\u001B[2J' });

      const result = stripAnsiTransformer({ frame });

      expect(result).toBe('');
    });
  });
});
