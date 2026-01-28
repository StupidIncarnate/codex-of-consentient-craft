import { debugCommandContract } from './debug-command-contract';
import {
  DebugCommandExitStub,
  DebugCommandGetScreenStub,
  DebugCommandInputStub,
  DebugCommandKeypressStub,
  DebugCommandStartStub,
  DebugCommandStub,
} from './debug-command.stub';
import { CliAppScreenStub } from '../cli-app-screen/cli-app-screen.stub';
import { KeyNameStub } from '../key-name/key-name.stub';

describe('debugCommandContract', () => {
  describe('start action', () => {
    it('VALID: {action: "start", screen: "menu"} => parses start command', () => {
      const screen = CliAppScreenStub({ value: 'menu' });

      const result = debugCommandContract.parse({
        action: 'start',
        screen,
      });

      expect(result).toStrictEqual({
        action: 'start',
        screen,
      });
    });

    it('VALID: {action: "start", screen: "help"} => parses start with different screen', () => {
      const screen = CliAppScreenStub({ value: 'help' });

      const result = debugCommandContract.parse({
        action: 'start',
        screen,
      });

      expect(result).toStrictEqual({
        action: 'start',
        screen,
      });
    });

    it('INVALID_SCREEN: {action: "start", missing screen} => throws validation error', () => {
      expect(() =>
        debugCommandContract.parse({
          action: 'start',
        }),
      ).toThrow(/required/iu);
    });

    it('INVALID_SCREEN: {action: "start", screen: "invalid"} => throws validation error', () => {
      expect(() =>
        debugCommandContract.parse({
          action: 'start',
          screen: 'invalid',
        }),
      ).toThrow(/invalid_enum_value/u);
    });
  });

  describe('input action', () => {
    it('VALID: {action: "input", text: "hello"} => parses input command', () => {
      const result = debugCommandContract.parse({
        action: 'input',
        text: 'hello',
      });

      expect(result).toStrictEqual({
        action: 'input',
        text: 'hello',
      });
    });

    it('VALID: {action: "input", text: "multi word text"} => parses input with spaces', () => {
      const result = debugCommandContract.parse({
        action: 'input',
        text: 'multi word text',
      });

      expect(result).toStrictEqual({
        action: 'input',
        text: 'multi word text',
      });
    });

    it('INVALID_TEXT: {action: "input", missing text} => throws validation error', () => {
      expect(() =>
        debugCommandContract.parse({
          action: 'input',
        }),
      ).toThrow(/required/iu);
    });

    it('INVALID_TEXT: {action: "input", text: ""} => throws validation error', () => {
      expect(() =>
        debugCommandContract.parse({
          action: 'input',
          text: '',
        }),
      ).toThrow(/too_small/u);
    });
  });

  describe('keypress action', () => {
    it('VALID: {action: "keypress", key: "enter"} => parses keypress command', () => {
      const key = KeyNameStub({ value: 'enter' });

      const result = debugCommandContract.parse({
        action: 'keypress',
        key,
      });

      expect(result).toStrictEqual({
        action: 'keypress',
        key,
      });
    });

    it('VALID: {action: "keypress", key: "escape"} => parses escape keypress', () => {
      const key = KeyNameStub({ value: 'escape' });

      const result = debugCommandContract.parse({
        action: 'keypress',
        key,
      });

      expect(result).toStrictEqual({
        action: 'keypress',
        key,
      });
    });

    it('VALID: {action: "keypress", key: "up"} => parses arrow keypress', () => {
      const key = KeyNameStub({ value: 'up' });

      const result = debugCommandContract.parse({
        action: 'keypress',
        key,
      });

      expect(result).toStrictEqual({
        action: 'keypress',
        key,
      });
    });

    it('INVALID_KEY: {action: "keypress", missing key} => throws validation error', () => {
      expect(() =>
        debugCommandContract.parse({
          action: 'keypress',
        }),
      ).toThrow(/required/iu);
    });

    it('INVALID_KEY: {action: "keypress", key: "invalid"} => throws validation error', () => {
      expect(() =>
        debugCommandContract.parse({
          action: 'keypress',
          key: 'invalid',
        }),
      ).toThrow(/invalid_enum_value/u);
    });
  });

  describe('getScreen action', () => {
    it('VALID: {action: "getScreen"} => parses getScreen command', () => {
      const result = debugCommandContract.parse({
        action: 'getScreen',
      });

      expect(result).toStrictEqual({
        action: 'getScreen',
      });
    });
  });

  describe('exit action', () => {
    it('VALID: {action: "exit"} => parses exit command', () => {
      const result = debugCommandContract.parse({
        action: 'exit',
      });

      expect(result).toStrictEqual({
        action: 'exit',
      });
    });
  });

  describe('invalid actions', () => {
    it('INVALID_ACTION: {action: "unknown"} => throws validation error', () => {
      expect(() =>
        debugCommandContract.parse({
          action: 'unknown',
        }),
      ).toThrow(/invalid discriminator/iu);
    });

    it('INVALID_ACTION: {missing action} => throws validation error', () => {
      expect(() =>
        debugCommandContract.parse({
          screen: 'menu',
        }),
      ).toThrow(/invalid discriminator/iu);
    });
  });
});

describe('DebugCommand stubs', () => {
  it('VALID: DebugCommandStartStub => returns start command', () => {
    const result = DebugCommandStartStub();

    expect(result.action).toBe('start');
  });

  it('VALID: DebugCommandInputStub => returns input command', () => {
    const result = DebugCommandInputStub();

    expect(result.action).toBe('input');
  });

  it('VALID: DebugCommandKeypressStub => returns keypress command', () => {
    const result = DebugCommandKeypressStub();

    expect(result.action).toBe('keypress');
  });

  it('VALID: DebugCommandGetScreenStub => returns getScreen command', () => {
    const result = DebugCommandGetScreenStub();

    expect(result.action).toBe('getScreen');
  });

  it('VALID: DebugCommandExitStub => returns exit command', () => {
    const result = DebugCommandExitStub();

    expect(result.action).toBe('exit');
  });

  it('VALID: DebugCommandStub => returns default start command', () => {
    const result = DebugCommandStub();

    expect(result.action).toBe('start');
  });
});
