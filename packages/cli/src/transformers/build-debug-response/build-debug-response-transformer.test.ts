import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { BuildDebugResponseParamsStub } from '../../contracts/build-debug-response-params/build-debug-response-params.stub';
import { CliAppScreenStub } from '../../contracts/cli-app-screen/cli-app-screen.stub';
import { DebugSessionCallbackInvocationsStub } from '../../contracts/debug-session-callback-invocations/debug-session-callback-invocations.stub';
import { ScreenNameStub } from '../../contracts/screen-name/screen-name.stub';
import { TerminalFrameStub } from '../../contracts/terminal-frame/terminal-frame.stub';

import { buildDebugResponseTransformer } from './build-debug-response-transformer';

describe('buildDebugResponseTransformer', () => {
  describe('success responses', () => {
    it('VALID: {success: true, empty frame} => returns success response with empty elements', () => {
      const params = BuildDebugResponseParamsStub({
        success: true,
        frame: TerminalFrameStub({ value: '' }),
      });

      const result = buildDebugResponseTransformer(params);

      expect(result.success).toBe(true);
      expect(result.screen?.elements).toStrictEqual([]);
      expect(result.error).toBeUndefined();
    });

    it('VALID: {success: true, frame with content} => returns response with parsed elements', () => {
      const frame = TerminalFrameStub({ value: '> Option 1\n  Option 2' });
      const params = BuildDebugResponseParamsStub({
        success: true,
        frame,
        currentScreen: CliAppScreenStub({ value: 'menu' }),
      });

      const result = buildDebugResponseTransformer(params);

      expect(result.success).toBe(true);
      expect(result.screen?.name).toBe(ScreenNameStub({ value: 'menu' }));
      expect(result.screen?.frame).toBe(frame);
      expect(result.screen?.elements.length).toBeGreaterThan(0);
    });

    it('VALID: {success: true, with callbacks} => returns response with callbacks record', () => {
      const invocations = DebugSessionCallbackInvocationsStub({
        onExit: [{}],
      });
      const params = BuildDebugResponseParamsStub({
        success: true,
        invocations,
      });

      const result = buildDebugResponseTransformer(params);

      expect(result.success).toBe(true);
      expect(result.callbacks).toBeDefined();
    });
  });

  describe('error responses', () => {
    it('VALID: {success: false, with error} => returns response with error message', () => {
      const error = ErrorMessageStub({ value: 'Session not started' });
      const params = BuildDebugResponseParamsStub({
        success: false,
        error,
      });

      const result = buildDebugResponseTransformer(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });
  });
});
