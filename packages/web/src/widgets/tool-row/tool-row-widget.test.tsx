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

  describe('long results', () => {
    // The row's own chevron is the ONLY disclosure. A second collapse inside a body already behind
    // one asks the reader to re-answer a question they answered by opening the row, so a long
    // result renders whole and offers no toggle at all.
    it('VALID: {long result content, expanded} => renders the result whole with no inner toggle', () => {
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

      expect(screen.getByTestId('TOOL_ROW_RESULT').textContent).toBe(`RESULT${'x'.repeat(2000)}`);
      expect(screen.queryByTestId('TOOL_ROW_TRUNCATION_TOGGLE')).toBe(null);
    });

    // A capped inner scroller is the other way to hide a long result, and it defeats the sticky
    // header — that header pins only while the row's content scrolls in the PANEL. It rode on a
    // wrapper Box around the body rather than on the body itself, so this asserts the result block
    // is EXACTLY its label and its content: a re-added wrapper shows up as an extra untagged child
    // long before anyone thinks to check a style.
    it('VALID: {long result content, expanded} => result block is the label and the body, nothing between', () => {
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
      const childTestIds = Array.from(result.children).map((child) =>
        child.getAttribute('data-testid'),
      );

      expect(childTestIds).toStrictEqual([null, 'TOOL_RESULT_VERBATIM']);
    });
  });

  // A Write's `content`, an Edit's `new_string` and a heredoc are documents, and the inline
  // `key: value` form collapses every newline in them into one italic run-on. They take the same
  // surface a tool's ANSWER takes, so a file body reads the same whether the agent wrote it or
  // read it back.
  describe('multi-line argument fields', () => {
    it('VALID: {Write, markdown content} => renders the document rather than one collapsed run', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Write',
        toolInput: JSON.stringify({
          file_path: '/quest-plans/round-1.md',
          content: '# Round 1\n\n## Context\nQuest ID: a7520e60\n',
        }),
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(
        screen.queryAllByTestId('MARKDOWN_HEADING').map((node) => node.textContent),
      ).toStrictEqual(['Round 1', 'Context']);
    });

    // The same guard the result side uses, for the same reason: most of what gets written is
    // source, and rejoining its lines into paragraphs would lose the only copy of the file.
    it('VALID: {Write, source content} => stays verbatim, so the lines are not rejoined', () => {
      ToolRowWidgetProxy();
      const source = 'export const a = 1;\nexport const b = 2;\n';
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Write',
        toolInput: JSON.stringify({ file_path: '/src/a.ts', content: source }),
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe(source);
      expect(screen.queryAllByTestId('MARKDOWN_TEXT')).toStrictEqual([]);
    });

    it('VALID: {Write, multi-line content} => captions the block with the field key', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Write',
        toolInput: JSON.stringify({
          file_path: '/src/a.ts',
          content: 'const a = 1;\nconst b = 2;',
        }),
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(
        screen.queryAllByTestId('TOOL_ROW_FIELD_LABEL').map((node) => node.textContent),
      ).toStrictEqual(['content']);
    });

    // A caption over a one-line command repeats what the row already said, so the block form keeps
    // its surface and drops its label — which is exactly how a Bash row rendered before.
    it('VALID: {Bash, single-line command} => takes the code surface with no caption', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Bash',
        toolInput: '{"command":"npm run ward"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(screen.getByTestId('TOOL_ROW_BLOCK_FIELD').textContent).toBe('npm run ward');
      expect(screen.queryByTestId('TOOL_ROW_FIELD_LABEL')).toBe(null);
    });

    it('VALID: {Read, single-line path} => stays inline and takes no code surface', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(screen.getByTestId('TOOL_ROW_DETAIL').textContent).toBe('file_path: /src/index.ts');
      expect(screen.queryByTestId('TOOL_ROW_BLOCK_FIELD')).toBe(null);
    });
  });

  describe('inline argument fields', () => {
    // A tail cut spends the whole budget on the directories a reader could already guess and drops
    // the filename, which is the only part that says WHICH file the call touched.
    it('VALID: {Write, path over the inline budget} => elides the middle so the filename survives', () => {
      ToolRowWidgetProxy();
      const filePath =
        '/home/brutus-home/projects/codex-of-consentient-craft/worktrees/server-health-badge-in-the-app-top-bar-try-2-a7520e60/.quest-plans/bde72c7a-6c21-4986-a91e-c8d154c0c8cc-round-1.md';
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Write',
        toolInput: JSON.stringify({ file_path: filePath }),
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(screen.getByTestId('TOOL_ROW_DETAIL').textContent).toBe(
        'file_path: /home/brutus-home/projects/codex-of-consentient-craft/worktrees/…/bde72c7a-6c21-4986-a91e-c8d154c0c8cc-round-1.mdshow more',
      );
    });

    // The elided form is the collapsed half of a disclosure, so the untouched path a reader copies
    // has to be one click away — the elision names a file to a human and resolves to nothing.
    it('VALID: {elided path, show more} => reveals the path untouched', async () => {
      ToolRowWidgetProxy();
      const filePath =
        '/home/brutus-home/projects/codex-of-consentient-craft/worktrees/server-health-badge-in-the-app-top-bar-try-2-a7520e60/.quest-plans/bde72c7a-6c21-4986-a91e-c8d154c0c8cc-round-1.md';
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Write',
        toolInput: JSON.stringify({ file_path: filePath }),
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      await userEvent.click(screen.getByTestId('TOOL_ROW_FIELD_TOGGLE'));

      expect(screen.getByTestId('TOOL_ROW_DETAIL').textContent).toBe(
        `file_path: ${filePath}show less`,
      );
    });

    it('VALID: {path within the inline budget} => renders untouched with no toggle', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(screen.getByTestId('TOOL_ROW_DETAIL').textContent).toBe('file_path: /src/index.ts');
      expect(screen.queryByTestId('TOOL_ROW_FIELD_TOGGLE')).toBe(null);
    });
  });

  describe('multi-line argument previews', () => {
    // Cutting a document by character count strands it mid-heading, and the markdown parser
    // downstream draws half a mark as the wrong mark — so the preview is whole LINES.
    it('VALID: {content over the line limit} => previews whole lines and offers the rest', async () => {
      ToolRowWidgetProxy();
      const lines = Array.from({ length: 30 }, (_, index) => `line ${String(index)}`);
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Write',
        toolInput: JSON.stringify({ file_path: '/src/a.ts', content: lines.join('\n') }),
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe(
        lines.slice(0, 12).join('\n'),
      );

      await userEvent.click(screen.getByTestId('TOOL_ROW_FIELD_TOGGLE'));

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe(lines.join('\n'));
    });

    // The backstop for the file that offers no line break to cut on — a minified bundle is one
    // line, so the line limit alone would render the whole thing.
    it('VALID: {content under the line limit but far over the char limit} => cuts at the char ceiling', () => {
      ToolRowWidgetProxy();
      const content = `${'x'.repeat(4000)}\nsecond line`;
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Write',
        toolInput: JSON.stringify({ file_path: '/src/bundle.js', content }),
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe('x'.repeat(1200));
    });

    it('VALID: {content within both limits} => renders whole and offers no toggle', () => {
      ToolRowWidgetProxy();
      const content = 'const a = 1;\nconst b = 2;';
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Write',
        toolInput: JSON.stringify({ file_path: '/src/a.ts', content }),
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe(content);
      expect(screen.queryByTestId('TOOL_ROW_FIELD_TOGGLE')).toBe(null);
    });
  });

  describe('disclosure anchoring', () => {
    // Collapsing a row the reader scrolled deep into has to carry them back to the header they
    // clicked, and the auto-scroll's ResizeObserver would otherwise read the shrink as new output
    // and throw them to the bottom instead. jsdom has no layout, so the hold is the half of the fix
    // it can observe; the arithmetic is covered by compute-anchor-scroll-top-transformer.test.ts.
    it('VALID: {click header to expand} => puts the auto-scroll on hold', async () => {
      const proxy = ToolRowWidgetProxy();
      proxy.setupAutoScrollReleased();
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'Read' });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} />,
      });

      expect(proxy.isAutoScrollHeld()).toBe(false);

      await userEvent.click(screen.getByTestId('TOOL_ROW_HEADER'));

      expect(proxy.isAutoScrollHeld()).toBe(true);
    });

    // The field toggle grows the row from the middle, so it needs the hold as much as the chevron
    // does — and it anchors the row HEADER, because several fields can each carry a toggle and a
    // callback ref would keep only the last of them.
    it('VALID: {click a field toggle} => puts the auto-scroll on hold', async () => {
      const proxy = ToolRowWidgetProxy();
      proxy.setupAutoScrollReleased();
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Write',
        toolInput: JSON.stringify({
          file_path: '/src/a.ts',
          content: Array.from({ length: 30 }, (_, index) => `line ${String(index)}`).join('\n'),
        }),
      });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      expect(proxy.isAutoScrollHeld()).toBe(false);

      await userEvent.click(screen.getByTestId('TOOL_ROW_FIELD_TOGGLE'));

      expect(proxy.isAutoScrollHeld()).toBe(true);
    });

    it('VALID: {click header to collapse} => puts the auto-scroll on hold', async () => {
      const proxy = ToolRowWidgetProxy();
      proxy.setupAutoScrollReleased();
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'Read' });

      mantineRenderAdapter({
        ui: <ToolRowWidget toolUse={toolUse as ToolUseEntry} defaultExpanded={true} />,
      });

      await userEvent.click(screen.getByTestId('TOOL_ROW_HEADER'));

      expect([screen.queryByTestId('TOOL_ROW_DETAIL'), proxy.isAutoScrollHeld()]).toStrictEqual([
        null,
        true,
      ]);
    });
  });

  describe('formatted result content', () => {
    it('VALID: {JSON result with a markdown property} => renders the document instead of escaped newlines', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'get-agent-prompt' });
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: JSON.stringify({
          model: 'sonnet',
          prompt: '# Operator\n\nYou own ONE operation item.',
        }),
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

      expect(screen.getByTestId('TOOL_ROW_RESULT').textContent).toBe(
        'RESULTmodel: sonnetpromptOperatorYou own ONE operation item.',
      );
      expect(
        screen.queryAllByTestId('MARKDOWN_HEADING').map((node) => node.textContent),
      ).toStrictEqual(['Operator']);
    });

    it('VALID: {plain multi-line result} => stays verbatim, so the lines are not rejoined', () => {
      ToolRowWidgetProxy();
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'Bash' });
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: '> @dungeonmaster/web@1.0.0 build\n> tsc\n\ndone in 4s',
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

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe(
        '> @dungeonmaster/web@1.0.0 build\n> tsc\n\ndone in 4s',
      );
      expect(screen.queryAllByTestId('MARKDOWN_TEXT')).toStrictEqual([]);
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
