import {
  DebugCommandStartStub,
  DebugCommandInputStub,
  DebugCommandKeypressStub,
  DebugCommandGetScreenStub,
  DebugCommandExitStub,
} from '../../../contracts/debug-command/debug-command.stub';
import { DebugSessionStateStub } from '../../../contracts/debug-session-state/debug-session-state.stub';
import { DebugSessionCallbackInvocationsStub } from '../../../contracts/debug-session-callback-invocations/debug-session-callback-invocations.stub';
import { RenderCapabilitiesStub } from '../../../contracts/render-capabilities/render-capabilities.stub';
import { TerminalFrameStub } from '../../../contracts/terminal-frame/terminal-frame.stub';
import { KeyNameStub } from '../../../contracts/key-name/key-name.stub';
import type { DebugResponseStub } from '../../../contracts/debug-response/debug-response.stub';

import { processDebugCommandLayerBroker } from './process-debug-command-layer-broker';
import { processDebugCommandLayerBrokerProxy } from './process-debug-command-layer-broker.proxy';

type DebugResponse = ReturnType<typeof DebugResponseStub>;

describe('processDebugCommandLayerBroker', () => {
  describe('start command', () => {
    it('VALID: {action: start} => calls onResponse with success', async () => {
      processDebugCommandLayerBrokerProxy();
      const command = DebugCommandStartStub();
      const state = DebugSessionStateStub();
      const invocations = DebugSessionCallbackInvocationsStub();
      const frame = TerminalFrameStub({ value: '> Menu' });
      const renderCapabilities = RenderCapabilitiesStub({
        getFrame: () => frame,
      });
      const onResponse = jest.fn();

      await processDebugCommandLayerBroker({
        command,
        state,
        invocations,
        renderCapabilities,
        onResponse,
      });

      expect(onResponse).toHaveBeenCalledTimes(1);

      const response = onResponse.mock.calls[0][0] as DebugResponse;

      expect(response.success).toBe(true);
    });
  });

  describe('input command', () => {
    it('VALID: {action: input, text: "hello"} => writes to stdin and responds', async () => {
      processDebugCommandLayerBrokerProxy();
      const command = DebugCommandInputStub({ text: 'hello' });
      const state = DebugSessionStateStub();
      const invocations = DebugSessionCallbackInvocationsStub();
      const writeStdin = jest.fn().mockReturnValue(true);
      const frame = TerminalFrameStub({ value: 'hello' });
      const renderCapabilities = RenderCapabilitiesStub({
        writeStdin,
        getFrame: () => frame,
      });
      const onResponse = jest.fn();

      await processDebugCommandLayerBroker({
        command,
        state,
        invocations,
        renderCapabilities,
        onResponse,
      });

      expect(writeStdin).toHaveBeenCalledWith('hello');

      const response = onResponse.mock.calls[0][0] as DebugResponse;

      expect(response.success).toBe(true);
    });
  });

  describe('keypress command', () => {
    it('VALID: {action: keypress, key: enter} => writes key code to stdin', async () => {
      processDebugCommandLayerBrokerProxy();
      const command = DebugCommandKeypressStub({ key: KeyNameStub({ value: 'enter' }) });
      const state = DebugSessionStateStub();
      const invocations = DebugSessionCallbackInvocationsStub();
      const writeStdin = jest.fn().mockReturnValue(true);
      const frame = TerminalFrameStub({ value: 'pressed' });
      const renderCapabilities = RenderCapabilitiesStub({
        writeStdin,
        getFrame: () => frame,
      });
      const onResponse = jest.fn();

      await processDebugCommandLayerBroker({
        command,
        state,
        invocations,
        renderCapabilities,
        onResponse,
      });

      expect(writeStdin).toHaveBeenCalledWith('\r');

      const response = onResponse.mock.calls[0][0] as DebugResponse;

      expect(response.success).toBe(true);
    });
  });

  describe('getScreen command', () => {
    it('VALID: {action: getScreen} => returns current screen state', async () => {
      processDebugCommandLayerBrokerProxy();
      const command = DebugCommandGetScreenStub();
      const state = DebugSessionStateStub();
      const invocations = DebugSessionCallbackInvocationsStub();
      const frame = TerminalFrameStub({ value: '> Menu\n  Help' });
      const renderCapabilities = RenderCapabilitiesStub({
        getFrame: () => frame,
      });
      const onResponse = jest.fn();

      await processDebugCommandLayerBroker({
        command,
        state,
        invocations,
        renderCapabilities,
        onResponse,
      });

      const response = onResponse.mock.calls[0][0] as DebugResponse;

      expect(response.success).toBe(true);
      expect(response.screen?.frame).toBe(frame);
    });
  });

  describe('exit command', () => {
    it('VALID: {action: exit} => unmounts and sets isExited', async () => {
      processDebugCommandLayerBrokerProxy();
      const command = DebugCommandExitStub();
      const state = DebugSessionStateStub({ isExited: false });
      const invocations = DebugSessionCallbackInvocationsStub();
      const unmount = jest.fn();
      const renderCapabilities = RenderCapabilitiesStub({
        unmount,
      });
      const onResponse = jest.fn();

      await processDebugCommandLayerBroker({
        command,
        state,
        invocations,
        renderCapabilities,
        onResponse,
      });

      expect(unmount).toHaveBeenCalledTimes(1);
      expect(state.isExited).toBe(true);

      const response = onResponse.mock.calls[0][0] as DebugResponse;

      expect(response.success).toBe(true);
    });
  });

  describe('session already exited', () => {
    it('ERROR: {isExited: true} => returns error response', async () => {
      processDebugCommandLayerBrokerProxy();
      const command = DebugCommandStartStub();
      const state = DebugSessionStateStub({ isExited: true });
      const invocations = DebugSessionCallbackInvocationsStub();
      const renderCapabilities = RenderCapabilitiesStub();
      const onResponse = jest.fn();

      await processDebugCommandLayerBroker({
        command,
        state,
        invocations,
        renderCapabilities,
        onResponse,
      });

      const response = onResponse.mock.calls[0][0] as DebugResponse;

      expect(response.success).toBe(false);
      expect(response.error).toBe('Session already exited');
    });
  });
});
