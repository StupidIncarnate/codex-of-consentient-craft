import { debugResponseContract } from './debug-response-contract';
import { DebugResponseStub } from './debug-response.stub';
import { ScreenNameStub } from '../screen-name/screen-name.stub';
import { TerminalFrameStub } from '../terminal-frame/terminal-frame.stub';
import { CallbackKeyStub } from '../callback-key/callback-key.stub';
import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

describe('debugResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {success: true, screen} => parses successfully', () => {
      const name = ScreenNameStub({ value: 'AnswerScreen' });
      const frame = TerminalFrameStub({ value: 'frame content' });

      const result = debugResponseContract.parse({
        success: true,
        screen: {
          name,
          frame,
          elements: [],
        },
      });

      expect(result).toStrictEqual({
        success: true,
        screen: {
          name,
          frame,
          elements: [],
        },
      });
    });

    it('VALID: {default stub} => returns default values', () => {
      const result = DebugResponseStub();

      expect(result.success).toBe(true);
      expect(result.screen?.name).toBe('MainScreen');
      expect(result.screen?.frame).toBe('┌─────────┐\n│ Content │\n└─────────┘');
      expect(result.screen?.elements).toStrictEqual([]);
    });

    it('VALID: {success: false, error} => parses error response', () => {
      const error = ErrorMessageStub({ value: 'Something went wrong' });

      const result = debugResponseContract.parse({
        success: false,
        error,
      });

      expect(result).toStrictEqual({
        success: false,
        error,
      });
    });

    it('VALID: {success: true, callbacks} => parses with callbacks', () => {
      const key = CallbackKeyStub({ value: 'onSubmit' });

      const result = debugResponseContract.parse({
        success: true,
        callbacks: {
          [key]: ['arg1', 42],
        },
      });

      expect(result).toStrictEqual({
        success: true,
        callbacks: {
          onSubmit: ['arg1', 42],
        },
      });
    });

    it('VALID: {success: true, no optional fields} => parses minimal response', () => {
      const result = debugResponseContract.parse({
        success: true,
      });

      expect(result).toStrictEqual({
        success: true,
      });
    });

    it('VALID: {success: true, screen with elements} => parses with elements', () => {
      const name = ScreenNameStub();
      const frame = TerminalFrameStub();

      const result = debugResponseContract.parse({
        success: true,
        screen: {
          name,
          frame,
          elements: [{ type: 'button', label: 'Submit' }],
        },
      });

      expect(result.success).toBe(true);
      expect(result.screen?.elements).toStrictEqual([{ type: 'button', label: 'Submit' }]);
    });

    it('VALID: {stub with success override} => respects override', () => {
      const error = ErrorMessageStub({ value: 'Test error' });

      const result = DebugResponseStub({
        success: false,
        screen: undefined,
        error,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('invalid responses', () => {
    it('INVALID_SUCCESS: {missing success} => throws validation error', () => {
      expect(() => {
        debugResponseContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_SCREEN_NAME: {screen.name: empty} => throws validation error', () => {
      expect(() => {
        debugResponseContract.parse({
          success: true,
          screen: {
            name: '',
            frame: 'content',
            elements: [],
          },
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_SUCCESS: {success: non-boolean} => throws validation error', () => {
      expect(() => {
        debugResponseContract.parse({
          success: 'true',
        });
      }).toThrow(/Expected boolean/u);
    });
  });
});
