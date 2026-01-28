import { debugSessionStateContract } from './debug-session-state-contract';
import { DebugSessionStateStub } from './debug-session-state.stub';

describe('debugSessionStateContract', () => {
  describe('valid input', () => {
    it('VALID: {currentScreen: menu, isExited: false} => parses successfully', () => {
      const input = DebugSessionStateStub();

      const result = debugSessionStateContract.parse(input);

      expect(result).toStrictEqual({
        currentScreen: 'menu',
        isExited: false,
      });
    });

    it('VALID: {currentScreen: add, isExited: true} => parses with different values', () => {
      const input = DebugSessionStateStub({
        currentScreen: 'add',
        isExited: true,
      });

      const result = debugSessionStateContract.parse(input);

      expect(result).toStrictEqual({
        currentScreen: 'add',
        isExited: true,
      });
    });

    it('VALID: {currentScreen: help} => parses help screen', () => {
      const input = DebugSessionStateStub({
        currentScreen: 'help',
      });

      const result = debugSessionStateContract.parse(input);

      expect(result).toStrictEqual({
        currentScreen: 'help',
        isExited: false,
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID_CURRENTSCREEN: {currentScreen: "invalid"} => throws validation error', () => {
      expect(() => {
        debugSessionStateContract.parse({
          currentScreen: 'invalid',
          isExited: false,
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_ISEXITED: {isExited: "yes"} => throws validation error', () => {
      expect(() => {
        debugSessionStateContract.parse({
          currentScreen: 'menu',
          isExited: 'yes' as never,
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_MULTIPLE: {missing required fields} => throws validation error', () => {
      expect(() => {
        debugSessionStateContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
