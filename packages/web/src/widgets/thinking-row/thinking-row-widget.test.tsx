import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { AssistantThinkingChatEntryStub } from '@dungeonmaster/shared/contracts';
import type { ThinkingRowWidgetProps } from './thinking-row-widget';
import { ThinkingRowWidget } from './thinking-row-widget';
import { ThinkingRowWidgetProxy } from './thinking-row-widget.proxy';

type ThinkingEntry = ThinkingRowWidgetProps['entry'];

describe('ThinkingRowWidget', () => {
  describe('rendering', () => {
    it('VALID: {content} => renders THINKING label and full content', () => {
      ThinkingRowWidgetProxy();
      const entry = AssistantThinkingChatEntryStub({ content: 'Let me think about this' });

      mantineRenderAdapter({
        ui: <ThinkingRowWidget entry={entry as ThinkingEntry} />,
      });

      const label = screen.getByTestId('THINKING_ROW_LABEL');
      const content = screen.getByTestId('THINKING_ROW_CONTENT');

      expect(label.textContent).toBe('THINKING');
      expect(content.textContent).toBe('Let me think about this');
    });

    it('VALID: {long content} => renders all content without truncation', () => {
      ThinkingRowWidgetProxy();
      const longContent = 'x'.repeat(2000);
      const entry = AssistantThinkingChatEntryStub({ content: longContent });

      mantineRenderAdapter({
        ui: <ThinkingRowWidget entry={entry as ThinkingEntry} />,
      });

      const content = screen.getByTestId('THINKING_ROW_CONTENT');

      expect(content.textContent).toBe(longContent);
    });

    it('VALID: {text-dim border} => renders with text-dim accent border', () => {
      ThinkingRowWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({
        ui: <ThinkingRowWidget entry={entry as ThinkingEntry} />,
      });

      const row = screen.getByTestId('THINKING_ROW');

      expect(row.style.borderLeft).toBe('3px solid rgb(138, 114, 96)');
    });
  });

  describe('model label', () => {
    it('VALID: {model present} => renders model name after THINKING', () => {
      ThinkingRowWidgetProxy();
      const entry = AssistantThinkingChatEntryStub({ model: 'claude-opus-4-6' });

      mantineRenderAdapter({
        ui: <ThinkingRowWidget entry={entry as ThinkingEntry} />,
      });

      const label = screen.getByTestId('THINKING_ROW_LABEL');

      expect(label.textContent).toBe('THINKING claude-opus-4-6');
    });

    it('VALID: {no model} => renders only THINKING label', () => {
      ThinkingRowWidgetProxy();
      const entry = AssistantThinkingChatEntryStub();

      mantineRenderAdapter({
        ui: <ThinkingRowWidget entry={entry as ThinkingEntry} />,
      });

      const label = screen.getByTestId('THINKING_ROW_LABEL');

      expect(label.textContent).toBe('THINKING');
    });
  });
});
