import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { AssistantToolUseChatEntryStub } from '../../contracts/chat-entry/chat-entry.stub';
import type { ToolUseLayerWidgetProps } from './tool-use-layer-widget';
import { ToolUseLayerWidget } from './tool-use-layer-widget';
import { ToolUseLayerWidgetProxy } from './tool-use-layer-widget.proxy';

type ToolUseEntry = ToolUseLayerWidgetProps['entry'];

describe('ToolUseLayerWidget', () => {
  describe('regular tool use', () => {
    it('VALID: {toolName: read_file} => renders TOOL CALL label with formatted fields', () => {
      ToolUseLayerWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{"path":"/src"}',
      });

      mantineRenderAdapter({
        ui: (
          <ToolUseLayerWidget
            entry={entry as ToolUseEntry}
            tokenBadgeElement={null}
            isSubagent={false}
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/TOOL CALL/u);
      expect(message.textContent).toMatch(/path/u);
      expect(message.textContent).toMatch(/\/src/u);
    });

    it('VALID: {isSubagent: true} => renders SUB-AGENT TOOL label', () => {
      ToolUseLayerWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{"path":"/src"}',
        source: 'subagent',
      });

      mantineRenderAdapter({
        ui: (
          <ToolUseLayerWidget
            entry={entry as ToolUseEntry}
            tokenBadgeElement={null}
            isSubagent={true}
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/SUB-AGENT TOOL/u);
    });

    it('VALID: {isLoading: true} => renders Running... indicator', () => {
      ToolUseLayerWidgetProxy();
      const entry = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({
        ui: (
          <ToolUseLayerWidget
            entry={entry as ToolUseEntry}
            isLoading={true}
            tokenBadgeElement={null}
            isSubagent={false}
          />
        ),
      });

      const loading = screen.getByTestId('TOOL_LOADING');

      expect(loading.textContent).toBe('Running...');
    });
  });

  describe('skill invocation', () => {
    it('VALID: {toolName: Skill} => renders SKILL label with skill name', () => {
      ToolUseLayerWidgetProxy();
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'Skill',
        toolInput: '{"skill":"commit","args":""}',
      });

      mantineRenderAdapter({
        ui: (
          <ToolUseLayerWidget
            entry={entry as ToolUseEntry}
            tokenBadgeElement={null}
            isSubagent={false}
          />
        ),
      });

      const message = screen.getByTestId('CHAT_MESSAGE');

      expect(message.textContent).toMatch(/SKILL/u);
      expect(message.textContent).toMatch(/commit/u);
    });
  });
});
