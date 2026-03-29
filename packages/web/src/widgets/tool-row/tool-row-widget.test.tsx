import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import type { ToolRowWidgetProps } from './tool-row-widget';
import { ToolRowWidget } from './tool-row-widget';
import { ToolRowWidgetProxy } from './tool-row-widget.proxy';

type ToolUseEntry = ToolRowWidgetProps['toolUse'];
type ToolResultEntry = NonNullable<ToolRowWidgetProps['toolResult']>;

describe('ToolRowWidget', () => {
  describe('collapsed rendering', () => {
    it('VALID: {toolName: Read, toolInput with path} => renders tool name and inline path summary', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      const name = screen.getByTestId('TOOL_ROW_NAME');
      const summary = screen.getByTestId('TOOL_ROW_SUMMARY');

      expect(name.textContent).toBe('Read');
      expect(summary.textContent).toBe('/src/index.ts');
      expect(screen.queryByTestId('TOOL_ROW_DETAIL')).toBe(null);
    });

    it('VALID: {toolName: Grep, multiple fields} => renders key: value pairs as summary', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Grep',
        toolInput: '{"pattern":"TODO","path":"/src"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      const summary = screen.getByTestId('TOOL_ROW_SUMMARY');

      expect(summary.textContent).toBe('pattern: TODO, path: /src');
    });

    it('VALID: {toolName: Skill} => renders "Skill: name" display name', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Skill',
        toolInput: '{"skill":"commit","args":""}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      const name = screen.getByTestId('TOOL_ROW_NAME');

      expect(name.textContent).toBe('Skill: commit');
    });

    it('VALID: {source: subagent} => renders with subagent accent on border', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
        source: 'subagent',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      const row = screen.getByTestId('TOOL_ROW');

      expect(row.style.borderLeft).toMatch(/^.*rgba\(232, 121, 249.*$/u);
    });

    it('VALID: {empty toolInput} => renders tool name with no summary element', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'read_file',
        toolInput: '{}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      expect(screen.getByTestId('TOOL_ROW_NAME').textContent).toBe('read_file');
      expect(screen.queryByTestId('TOOL_ROW_SUMMARY')).toBe(null);
    });
  });

  describe('status icons', () => {
    it('VALID: {no result, not loading} => renders no status icon', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      expect(screen.queryByTestId('TOOL_ROW_STATUS')).toBe(null);
    });

    it('VALID: {isLoading, no result} => renders pulsing loading dots', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} isLoading={true} />,
      });

      const status = screen.getByTestId('TOOL_ROW_STATUS');
      const statusStyle = status.style;

      expect(status.textContent).toBe('\u00B7\u00B7\u00B7');
      expect(statusStyle.animation).toMatch(/^.*pulse.*$/u);
    });

    it('VALID: {successful result} => renders green check', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file contents',
      });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
          />
        ),
      });

      const status = screen.getByTestId('TOOL_ROW_STATUS');

      expect(status.textContent).toBe('\u2713');
    });

    it('VALID: {error result} => renders red cross', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'Permission denied',
        isError: true,
      });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
          />
        ),
      });

      const status = screen.getByTestId('TOOL_ROW_STATUS');

      expect(status.textContent).toBe('\u2717');
    });

    it('VALID: {skipped result} => renders warning skip icon', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'Sibling tool call errored, skipping',
      });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
          />
        ),
      });

      const status = screen.getByTestId('TOOL_ROW_STATUS');

      expect(status.textContent).toBe('\u2298');
    });
  });

  describe('expand and collapse', () => {
    it('VALID: {click header} => expands to show detail panel', async () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      expect(screen.queryByTestId('TOOL_ROW_DETAIL')).toBe(null);

      await userEvent.click(screen.getByTestId('TOOL_ROW_HEADER'));

      expect(screen.getByTestId('TOOL_ROW_DETAIL')).not.toBe(null);
    });

    it('VALID: {defaultExpanded: true} => starts expanded', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(screen.getByTestId('TOOL_ROW_DETAIL')).not.toBe(null);
    });

    it('VALID: {click expanded header} => collapses detail panel', async () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      await userEvent.click(screen.getByTestId('TOOL_ROW_HEADER'));

      expect(screen.queryByTestId('TOOL_ROW_DETAIL')).toBe(null);
    });
  });

  describe('expanded detail content', () => {
    it('VALID: {Bash command} => renders command in code block style', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Bash',
        toolInput: '{"command":"npm run ward"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      const detail = screen.getByTestId('TOOL_ROW_DETAIL');

      expect(detail.textContent).toMatch(/^.*npm run ward.*$/u);
    });

    it('VALID: {successful result} => renders RESULT label with content', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file contents here',
      });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
            defaultExpanded={true}
          />
        ),
      });

      const result = screen.getByTestId('TOOL_ROW_RESULT');

      expect(result.textContent).toMatch(/^(?=.*RESULT)(?=.*file contents here).*$/u);
    });

    it('VALID: {error result, expanded} => renders TOOL ERROR label', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'Permission denied',
        isError: true,
      });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
            defaultExpanded={true}
          />
        ),
      });

      const result = screen.getByTestId('TOOL_ROW_RESULT');

      expect(result.textContent).toMatch(/^.*TOOL ERROR.*$/u);
    });

    it('VALID: {hook blocked result, expanded} => renders HOOK BLOCKED label', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'PreToolUse: denied by policy',
        isError: true,
      });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
            defaultExpanded={true}
          />
        ),
      });

      const result = screen.getByTestId('TOOL_ROW_RESULT');

      expect(result.textContent).toMatch(/^.*HOOK BLOCKED.*$/u);
    });

    it('VALID: {skipped result, expanded} => renders SKIPPED message', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'Sibling tool call errored, skipping',
      });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
            defaultExpanded={true}
          />
        ),
      });

      const result = screen.getByTestId('TOOL_ROW_RESULT');

      expect(result.textContent).toMatch(
        /^(?=.*SKIPPED)(?=.*This tool call was skipped because another tool call in the same batch failed).*$/u,
      );
    });

    it('VALID: {isLoading, no result, expanded} => renders Running... indicator', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            isLoading={true}
            defaultExpanded={true}
          />
        ),
      });

      const loading = screen.getByTestId('TOOL_LOADING');

      expect(loading.textContent).toBe('Running...');
    });
  });

  describe('long result truncation', () => {
    it('VALID: {long result content} => shows truncated with "Show full result"', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'x'.repeat(2000),
      });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
            defaultExpanded={true}
          />
        ),
      });

      const result = screen.getByTestId('TOOL_ROW_RESULT');

      expect(result.textContent).toMatch(/^.*Show full result.*$/u);
    });

    it('VALID: {click "Show full result"} => expands and shows "Collapse"', async () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'x'.repeat(2000),
      });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
            defaultExpanded={true}
          />
        ),
      });

      const showLink = screen.getByTestId('TOOL_ROW_TRUNCATION_TOGGLE');
      await userEvent.click(showLink);

      const result = screen.getByTestId('TOOL_ROW_RESULT');

      expect(result.textContent).toMatch(/^.*Collapse.*$/u);
    });
  });
});
