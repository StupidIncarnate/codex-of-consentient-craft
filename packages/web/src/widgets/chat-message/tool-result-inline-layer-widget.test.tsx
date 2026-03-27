import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { AssistantToolResultChatEntryStub } from '../../contracts/chat-entry/chat-entry.stub';
import type { ToolResultInlineLayerWidgetProps } from './tool-result-inline-layer-widget';
import { ToolResultInlineLayerWidget } from './tool-result-inline-layer-widget';
import { ToolResultInlineLayerWidgetProxy } from './tool-result-inline-layer-widget.proxy';

type ToolResultEntry = ToolResultInlineLayerWidgetProps['toolResult'];

describe('ToolResultInlineLayerWidget', () => {
  describe('successful result', () => {
    it('VALID: {content: "file contents"} => renders RESULT label with content', () => {
      ToolResultInlineLayerWidgetProxy();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file contents here',
      });

      mantineRenderAdapter({
        ui: <ToolResultInlineLayerWidget toolResult={toolResult as ToolResultEntry} />,
      });

      const inline = screen.getByTestId('TOOL_RESULT_INLINE');

      expect(inline.textContent).toMatch(/RESULT/u);
      expect(inline.textContent).toMatch(/file contents here/u);
    });
  });

  describe('error result', () => {
    it('VALID: {isError: true} => renders TOOL ERROR label', () => {
      ToolResultInlineLayerWidgetProxy();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'Permission denied',
        isError: true,
      });

      mantineRenderAdapter({
        ui: <ToolResultInlineLayerWidget toolResult={toolResult as ToolResultEntry} />,
      });

      const inline = screen.getByTestId('TOOL_RESULT_INLINE');

      expect(inline.textContent).toMatch(/TOOL ERROR/u);
      expect(inline.textContent).toMatch(/Permission denied/u);
    });
  });

  describe('hook blocked result', () => {
    it('VALID: {isError + PreToolUse prefix} => renders HOOK BLOCKED label', () => {
      ToolResultInlineLayerWidgetProxy();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'PreToolUse: denied by policy',
        isError: true,
      });

      mantineRenderAdapter({
        ui: <ToolResultInlineLayerWidget toolResult={toolResult as ToolResultEntry} />,
      });

      const inline = screen.getByTestId('TOOL_RESULT_INLINE');

      expect(inline.textContent).toMatch(/HOOK BLOCKED/u);
    });
  });

  describe('skipped result', () => {
    it('VALID: {content contains "Sibling tool call errored"} => renders SKIPPED label', () => {
      ToolResultInlineLayerWidgetProxy();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'Sibling tool call errored, skipping',
      });

      mantineRenderAdapter({
        ui: <ToolResultInlineLayerWidget toolResult={toolResult as ToolResultEntry} />,
      });

      const inline = screen.getByTestId('TOOL_RESULT_INLINE');

      expect(inline.textContent).toMatch(/SKIPPED/u);
    });
  });

  describe('long content truncation', () => {
    it('VALID: {long content} => shows truncated with "Show full result" link', () => {
      ToolResultInlineLayerWidgetProxy();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'x'.repeat(2000),
      });

      mantineRenderAdapter({
        ui: <ToolResultInlineLayerWidget toolResult={toolResult as ToolResultEntry} />,
      });

      const inline = screen.getByTestId('TOOL_RESULT_INLINE');

      expect(inline.textContent).toMatch(/Show full result/u);
    });

    it('VALID: {click "Show full result"} => expands and shows "Collapse"', async () => {
      ToolResultInlineLayerWidgetProxy();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'x'.repeat(2000),
      });

      mantineRenderAdapter({
        ui: <ToolResultInlineLayerWidget toolResult={toolResult as ToolResultEntry} />,
      });

      const showLink = screen.getByText('Show full result');
      await userEvent.click(showLink);

      const inline = screen.getByTestId('TOOL_RESULT_INLINE');

      expect(inline.textContent).toMatch(/Collapse/u);
    });
  });
});
