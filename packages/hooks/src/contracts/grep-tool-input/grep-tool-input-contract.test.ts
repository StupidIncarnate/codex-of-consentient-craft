import { grepToolInputContract } from './grep-tool-input-contract';
import { GrepToolInputStub } from './grep-tool-input.stub';

type GrepToolInput = ReturnType<typeof GrepToolInputStub>;

describe('grepToolInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {pattern: "searchTerm"} => parses with defaults', () => {
      const input: GrepToolInput = GrepToolInputStub();

      expect(input).toStrictEqual({
        pattern: 'searchTerm',
      });
    });

    it('VALID: {pattern, output_mode: "content"} => parses with output_mode', () => {
      const input: GrepToolInput = GrepToolInputStub({
        output_mode: 'content',
      });

      expect(input).toStrictEqual({
        pattern: 'searchTerm',
        output_mode: 'content',
      });
    });

    it('VALID: {pattern, -A: 3, -B: 2} => parses with context flags', () => {
      const input: GrepToolInput = GrepToolInputStub({
        '-A': 3,
        '-B': 2,
      });

      expect(input).toStrictEqual({
        pattern: 'searchTerm',
        '-A': 3,
        '-B': 2,
      });
    });

    it('VALID: {pattern, path, glob, type} => parses all optional string fields', () => {
      const input: GrepToolInput = GrepToolInputStub({
        path: '/src',
        glob: '*.ts',
        type: 'ts',
      });

      expect(input).toStrictEqual({
        pattern: 'searchTerm',
        path: '/src',
        glob: '*.ts',
        type: 'ts',
      });
    });

    it('VALID: {pattern, multiline: true} => parses multiline flag', () => {
      const input: GrepToolInput = GrepToolInputStub({
        multiline: true,
      });

      expect(input).toStrictEqual({
        pattern: 'searchTerm',
        multiline: true,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {pattern: ""} => throws validation error', () => {
      expect(() => {
        return grepToolInputContract.parse({ pattern: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {no pattern} => throws validation error', () => {
      expect(() => {
        return grepToolInputContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {output_mode: "invalid"} => throws validation error', () => {
      expect(() => {
        return grepToolInputContract.parse({ pattern: 'test', output_mode: 'invalid' });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
