import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { FormattedTokenLabelStub } from '../../contracts/formatted-token-label/formatted-token-label.stub';
import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  CssPixelsStub,
} from '@dungeonmaster/shared/contracts';
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

      expect(row.style.borderLeft).toBe('3px solid rgba(232, 121, 249, 0.5)');
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
      expect(statusStyle.animation).toBe('pulse 1.5s infinite');
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

      expect(screen.getByTestId('TOOL_ROW_DETAIL')).toBeInTheDocument();
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

      expect(screen.getByTestId('TOOL_ROW_DETAIL')).toBeInTheDocument();
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

    it('VALID: {defaultExpanded true then false} => closes itself when the call stops being the one in flight', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file contents here',
      });

      const { rerender } = mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            isLoading={true}
            defaultExpanded={true}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_ROW_DETAIL')).toBeInTheDocument();

      rerender(
        <ToolRowWidget
          toolUse={toolUse as ToolUseEntry}
          toolResult={toolResult as ToolResultEntry}
        />,
      );

      expect(screen.queryByTestId('TOOL_ROW_DETAIL')).toBe(null);
    });

    it('VALID: {defaultExpanded true, reader collapses, still defaultExpanded on re-render} => stays collapsed', async () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });

      const { rerender } = mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            isLoading={true}
            defaultExpanded={true}
          />
        ),
      });

      await userEvent.click(screen.getByTestId('TOOL_ROW_HEADER'));

      expect(screen.queryByTestId('TOOL_ROW_DETAIL')).toBe(null);

      rerender(
        <ToolRowWidget toolUse={toolUse as ToolUseEntry} isLoading={true} defaultExpanded={true} />,
      );

      expect(screen.queryByTestId('TOOL_ROW_DETAIL')).toBe(null);
    });

    it('VALID: {reader expands a settled row, then it re-renders} => stays open', async () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file contents here',
      });

      const { rerender } = mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
          />
        ),
      });

      await userEvent.click(screen.getByTestId('TOOL_ROW_HEADER'));

      expect(screen.getByTestId('TOOL_ROW_DETAIL')).toBeInTheDocument();

      rerender(
        <ToolRowWidget
          toolUse={toolUse as ToolUseEntry}
          toolResult={toolResult as ToolResultEntry}
          resultTokenBadgeLabel={FormattedTokenLabelStub({ value: '~1.2k est' })}
        />,
      );

      expect(screen.getByTestId('TOOL_ROW_DETAIL')).toBeInTheDocument();
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

      expect(detail.textContent).toBe('npm run ward');
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

      const resultText = result.textContent;

      expect(resultText).toBe('RESULTfile contents here');
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

      expect(result.textContent).toBe('TOOL ERRORPermission denied');
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

      expect(result.textContent).toBe('HOOK BLOCKEDPreToolUse: denied by policy');
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

      expect(result.textContent).toBe(
        'SKIPPEDThis tool call was skipped because another tool call in the same batch failed.',
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

      expect(result.textContent).toBe(`RESULT${'x'.repeat(200)}Show full result`);
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

      expect(result.textContent).toBe(`RESULT${'x'.repeat(2000)}Collapse`);
    });
  });

  describe('scannable label', () => {
    it('VALID: {toolName: Bash, git command} => names the command instead of "Bash"', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Bash',
        toolInput:
          '{"command":"git diff -- packages/web/src/widgets/tool-row/tool-row-widget.tsx"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      expect(screen.getByTestId('TOOL_ROW_NAME').textContent).toBe('git diff');
      expect(screen.getByTestId('TOOL_ROW_SUMMARY').textContent).toBe(
        'git diff -- web/…/tool-row-widget.tsx',
      );
    });

    it('VALID: {toolName: mcp__dungeonmaster__discover} => strips the MCP server prefix', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'mcp__dungeonmaster__discover',
        toolInput: '{"glob":"packages/web/src/widgets/app/**"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      expect(screen.getByTestId('TOOL_ROW_NAME').textContent).toBe('discover');
      expect(screen.getByTestId('TOOL_ROW_SUMMARY').textContent).toBe('glob: web/…/app/**');
    });

    it('VALID: {toolName: Read, deep repo path} => elides the directory spine in the summary', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput:
          '{"file_path":"packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      expect(screen.getByTestId('TOOL_ROW_SUMMARY').textContent).toBe(
        'web/…/use-quest-chat-binding.ts',
      );
    });

    it('VALID: {toolName: Read, expanded} => detail keeps the untouched path', async () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput:
          '{"file_path":"packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      await userEvent.click(screen.getByTestId('TOOL_ROW_HEADER'));

      expect(screen.getByTestId('TOOL_ROW_DETAIL').textContent).toBe(
        'file_path: packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
      );
    });
  });

  describe('single-line header', () => {
    it('VALID: {resultTokenBadgeLabel} => badge sits inside the header, not on a second row', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'Read' });
      const toolResult = AssistantToolResultChatEntryStub({ toolName: 'use_1' });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
            resultTokenBadgeLabel={FormattedTokenLabelStub({ value: '~808 est' })}
          />
        ),
      });

      const header = screen.getByTestId('TOOL_ROW_HEADER');
      const badge = screen.getByTestId('RESULT_TOKEN_BADGE');

      expect(header.contains(badge)).toBe(true);
      expect(header.textContent).toBe('▸Read/test~808 est✓');
    });

    it('VALID: {resultTokenBadgeLabel} => collapsed row renders the header as its only child', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'Read' });
      const toolResult = AssistantToolResultChatEntryStub({ toolName: 'use_1' });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            toolResult={toolResult as ToolResultEntry}
            resultTokenBadgeLabel={FormattedTokenLabelStub({ value: '~808 est' })}
          />
        ),
      });

      const row = screen.getByTestId('TOOL_ROW');
      const childTestIds = Array.from(row.children).map((child) =>
        child.getAttribute('data-testid'),
      );

      expect(childTestIds).toStrictEqual(['TOOL_ROW_HEADER']);
    });
  });

  describe('sticky header', () => {
    it('VALID: {no stickyTop} => header pins flush to the panel it is rendered straight into', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'Read' });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      const header = screen.getByTestId('TOOL_ROW_HEADER');

      expect([header.style.position, header.style.top, header.style.zIndex]).toStrictEqual([
        'sticky',
        '0px',
        '100',
      ]);
    });

    it('VALID: {stickyTop: 54} => header pins below the row and chain it is nested in, one band down', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'Read' });

      mantineRenderAdapter({
        ui: (
          <ToolRowWidget
            toolUse={toolUse as ToolUseEntry}
            defaultExpanded={true}
            stickyTop={CssPixelsStub({ value: 54 })}
          />
        ),
      });

      const header = screen.getByTestId('TOOL_ROW_HEADER');

      expect([header.style.position, header.style.top, header.style.zIndex]).toStrictEqual([
        'sticky',
        '54px',
        '46',
      ]);
    });

    // The offsets below this row are built on this number, so it is declared rather than left to
    // whatever the content lays out to — and the fill is what stops the open detail scrolling
    // underneath from reading through the pinned bar.
    it('VALID: {expanded} => header declares its measured height and an opaque fill', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'Read' });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      const header = screen.getByTestId('TOOL_ROW_HEADER');

      expect([
        header.style.height,
        header.style.boxSizing,
        header.style.backgroundColor,
      ]).toStrictEqual(['25px', 'border-box', 'rgb(42, 26, 20)']);
    });
  });
});
