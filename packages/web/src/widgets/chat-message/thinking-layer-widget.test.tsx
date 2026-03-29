import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { AssistantThinkingChatEntryStub } from '../../contracts/chat-entry/chat-entry.stub';
import type { ThinkingLayerWidgetProps } from './thinking-layer-widget';
import { ThinkingLayerWidget } from './thinking-layer-widget';
import { ThinkingLayerWidgetProxy } from './thinking-layer-widget.proxy';

type ThinkingEntry = ThinkingLayerWidgetProps['entry'];

describe('ThinkingLayerWidget', () => {
  describe('label rendering', () => {
    it('VALID: {type: thinking} => renders THINKING label', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub({ content: 'Let me think about this' });

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      const messageText = message.textContent;

      expect(messageText).toContain('THINKING');
      expect(messageText).toContain('Let me think about this');
    });

    it('VALID: {type: thinking} => renders text-dim borders', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect([message.style.borderLeft, message.style.borderRight]).toStrictEqual([
        '2px solid rgb(138, 114, 96)',

        '2px solid rgb(138, 114, 96)',
      ]);
    });

    it('VALID: {type: thinking} => renders with a little paddingLeft', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.paddingLeft).toBe('10px');
    });
  });

  describe('model label', () => {
    it('VALID: {model present} => renders model name after THINKING label', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub({ model: 'claude-opus-4-6' });

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      const messageText = message.textContent;

      expect(messageText).toContain('THINKING');
      expect(messageText).toContain('claude-opus-4-6');
    });

    it('VALID: {no model} => does not render model suffix', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      const messageText = message.textContent;

      expect(messageText).toContain('THINKING');
      expect(messageText).not.toContain('claude');
    });
  });

  describe('content truncation', () => {
    it('VALID: {short content} => renders content without toggle', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub({ content: 'Short thought' });

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      expect(screen.queryByTestId('THINKING_TOGGLE')).toBe(null);
    });

    it('VALID: {long content} => renders expand toggle', () => {
      ThinkingLayerWidgetProxy();
      const longContent = 'x'.repeat(300);
      const entry = AssistantThinkingChatEntryStub({ content: longContent });

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      const toggle = screen.getByTestId('THINKING_TOGGLE');

      expect(toggle.textContent).toBe('Show full thinking');
    });
  });
});
