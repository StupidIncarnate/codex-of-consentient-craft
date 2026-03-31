import { globToolInputContract } from './glob-tool-input-contract';
import { GlobToolInputStub } from './glob-tool-input.stub';

type GlobToolInput = ReturnType<typeof GlobToolInputStub>;

describe('globToolInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {pattern: "**/*.ts"} => parses with defaults', () => {
      const input: GlobToolInput = GlobToolInputStub();

      expect(input).toStrictEqual({
        pattern: '**/*.ts',
      });
    });

    it('VALID: {pattern, path} => parses with optional path', () => {
      const input: GlobToolInput = GlobToolInputStub({
        pattern: 'src/**/*.tsx',
        path: '/home/user/project',
      });

      expect(input).toStrictEqual({
        pattern: 'src/**/*.tsx',
        path: '/home/user/project',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {pattern: ""} => throws validation error', () => {
      expect(() => {
        return globToolInputContract.parse({ pattern: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {no pattern} => throws validation error', () => {
      expect(() => {
        return globToolInputContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
