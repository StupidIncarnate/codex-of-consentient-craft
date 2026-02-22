import { cliSignalContract } from './cli-signal-contract';
import { CliSignalStub } from './cli-signal.stub';

describe('cliSignalContract', () => {
  describe('valid signals', () => {
    it('VALID: {action: "return", screen: "list", timestamp} => parses successfully', () => {
      const signal = CliSignalStub({
        action: 'return',
        screen: 'list',
        timestamp: '2024-01-01T00:00:00.000Z',
      });

      const result = cliSignalContract.parse(signal);

      expect(result).toStrictEqual({
        action: 'return',
        screen: 'list',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {screen: "menu"} => parses with menu screen', () => {
      const signal = CliSignalStub({ screen: 'menu' });

      const result = cliSignalContract.parse(signal);

      expect(result.screen).toBe('menu');
    });
  });

  describe('invalid signals', () => {
    it('INVALID_ACTION: {action: "invalid"} => throws validation error', () => {
      expect(() => {
        cliSignalContract.parse({
          action: 'invalid',
          screen: 'list',
          timestamp: '2024-01-01T00:00:00.000Z',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID_SCREEN: {screen: "invalid"} => throws validation error', () => {
      expect(() => {
        cliSignalContract.parse({
          action: 'return',
          screen: 'invalid',
          timestamp: '2024-01-01T00:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_TIMESTAMP: {timestamp: "not-a-date"} => throws validation error', () => {
      expect(() => {
        cliSignalContract.parse({
          action: 'return',
          screen: 'list',
          timestamp: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        cliSignalContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
