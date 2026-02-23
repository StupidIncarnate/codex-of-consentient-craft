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

      expect(message.textContent).toMatch(/THINKING/u);
      expect(message.textContent).toMatch(/Let me think about this/u);
    });

    it('VALID: {type: thinking} => renders text-dim borders', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.borderLeft).toBe('2px solid rgb(138, 114, 96)');
      expect(message.style.borderRight).toBe('2px solid rgb(138, 114, 96)');
    });

    it('VALID: {type: thinking} => renders with 15% paddingLeft', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.style.paddingLeft).toBe('15%');
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

      expect(message.textContent).toMatch(/THINKING/u);
      expect(message.textContent).toMatch(/claude-opus-4-6/u);
    });

    it('VALID: {no model} => does not render model suffix', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/^THINKING/u);
      expect(message.textContent).not.toMatch(/claude/u);
    });
  });

  describe('content truncation', () => {
    it('VALID: {short content} => renders content without toggle', () => {
      ThinkingLayerWidgetProxy();
      const entry = AssistantThinkingChatEntryStub({ content: 'Short thought' });

      mantineRenderAdapter({
        ui: <ThinkingLayerWidget entry={entry as ThinkingEntry} />,
      });

      expect(screen.queryByTestId('THINKING_TOGGLE')).toBeNull();
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
