import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
  SystemErrorChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { ExecutionMessageWidget } from './execution-message-widget';
import { ExecutionMessageWidgetProxy } from './execution-message-widget.proxy';

describe('ExecutionMessageWidget', () => {
  describe('text entry', () => {
    it('VALID: {text entry} => renders role label and content', () => {
      ExecutionMessageWidgetProxy();
      const entry = AssistantTextChatEntryStub({ content: 'Building auth module...' });

      mantineRenderAdapter({
        ui: <ExecutionMessageWidget entry={entry} roleName="pathseeker" roleColor="primary" />,
      });

      const widget = screen.getByTestId('execution-message-widget');

      expect(widget.textContent).toMatch(/PATHSEEKER/u);
      expect(widget.textContent).toMatch(/Building auth module/u);
    });
  });

  describe('tool_use entry', () => {
    it('VALID: {tool_use entry} => renders TOOL CALL label with italic text', () => {
      ExecutionMessageWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'Edit',
        toolInput: '{"file":"src/auth.ts"}',
      });

      mantineRenderAdapter({
        ui: <ExecutionMessageWidget entry={entry} roleName="pathseeker" roleColor="primary" />,
      });

      const widget = screen.getByTestId('execution-message-widget');
      const content = screen.getByTestId('execution-message-content');

      expect(widget.textContent).toMatch(/TOOL CALL/u);
      expect(content.textContent).toMatch(/Edit/u);
      expect(content.style.fontStyle).toBe('italic');
    });
  });

  describe('thinking entry', () => {
    it('VALID: {thinking entry} => renders null', () => {
      ExecutionMessageWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({
        ui: <ExecutionMessageWidget entry={entry} roleName="pathseeker" roleColor="primary" />,
      });

      expect(screen.queryByTestId('execution-message-widget')).toBeNull();
    });
  });

  describe('tool_result entry', () => {
    it('VALID: {tool_result entry} => renders null', () => {
      ExecutionMessageWidgetProxy();
      const entry = AssistantToolResultChatEntryStub();

      mantineRenderAdapter({
        ui: <ExecutionMessageWidget entry={entry} roleName="pathseeker" roleColor="primary" />,
      });

      expect(screen.queryByTestId('execution-message-widget')).toBeNull();
    });
  });

  describe('user entry', () => {
    it('VALID: {user entry} => renders null', () => {
      ExecutionMessageWidgetProxy();
      const entry = UserChatEntryStub();

      mantineRenderAdapter({
        ui: <ExecutionMessageWidget entry={entry} roleName="pathseeker" roleColor="primary" />,
      });

      expect(screen.queryByTestId('execution-message-widget')).toBeNull();
    });
  });

  describe('system entry', () => {
    it('VALID: {system entry} => renders null', () => {
      ExecutionMessageWidgetProxy();
      const entry = SystemErrorChatEntryStub();

      mantineRenderAdapter({
        ui: <ExecutionMessageWidget entry={entry} roleName="pathseeker" roleColor="primary" />,
      });

      expect(screen.queryByTestId('execution-message-widget')).toBeNull();
    });
  });
});
