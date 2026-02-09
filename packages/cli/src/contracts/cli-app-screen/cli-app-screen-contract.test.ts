import { cliAppScreenContract } from './cli-app-screen-contract';
import { CliAppScreenStub } from './cli-app-screen.stub';

type CliAppScreen = ReturnType<typeof CliAppScreenStub>;

describe('cliAppScreenContract', () => {
  describe('valid screens', () => {
    it('VALID: {value: "menu"} => parses menu screen', () => {
      const result = cliAppScreenContract.parse('menu');

      expect(result).toBe('menu');
    });

    it('VALID: {value: "help"} => parses help screen', () => {
      const result = cliAppScreenContract.parse('help');

      expect(result).toBe('help');
    });

    it('VALID: {value: "list"} => parses list screen', () => {
      const result = cliAppScreenContract.parse('list');

      expect(result).toBe('list');
    });

    it('VALID: {value: "init"} => parses init screen', () => {
      const result = cliAppScreenContract.parse('init');

      expect(result).toBe('init');
    });

    it('VALID: {value: "run"} => parses run screen', () => {
      const result = cliAppScreenContract.parse('run');

      expect(result).toBe('run');
    });

    it('VALID: stub default => returns menu screen', () => {
      const screen: CliAppScreen = CliAppScreenStub();

      expect(screen).toBe('menu');
    });

    it('VALID: stub with custom value => returns custom screen', () => {
      const screen = CliAppScreenStub({ value: 'help' });

      expect(screen).toBe('help');
    });
  });

  describe('invalid screens', () => {
    it('INVALID_SCREEN: {value: "unknown"} => throws validation error', () => {
      expect(() => cliAppScreenContract.parse('unknown')).toThrow(/invalid_enum_value/u);
    });

    it('INVALID_SCREEN: {value: ""} => throws validation error', () => {
      expect(() => cliAppScreenContract.parse('')).toThrow(/invalid_enum_value/u);
    });

    it('INVALID_SCREEN: {value: null} => throws validation error', () => {
      expect(() => cliAppScreenContract.parse(null)).toThrow(/invalid_type/u);
    });

    it('INVALID_SCREEN: {value: number} => throws validation error', () => {
      expect(() => cliAppScreenContract.parse(123 as never)).toThrow(/invalid_type/u);
    });
  });
});
