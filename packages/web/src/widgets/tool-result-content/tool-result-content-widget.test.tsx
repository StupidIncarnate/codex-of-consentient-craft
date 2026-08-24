import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ToolResultDisplayContentStub } from '../../contracts/tool-result-display-content/tool-result-display-content.stub';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ToolResultContentWidget } from './tool-result-content-widget';
import { ToolResultContentWidgetProxy } from './tool-result-content-widget.proxy';

const DIM = emberDepthsThemeStatics.colors['text-dim'];

describe('ToolResultContentWidget', () => {
  describe('replies that already read as themselves', () => {
    it('VALID: {one-line reply} => renders it verbatim in a single text node', () => {
      ToolResultContentWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ToolResultContentWidget
            content={ToolResultDisplayContentStub({ value: 'file contents here' })}
            color={DIM}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe('file contents here');
      expect(screen.queryByTestId('TOOL_RESULT_FORMATTED')).toBe(null);
    });

    it('VALID: {build log} => renders it verbatim, so the lines survive', () => {
      ToolResultContentWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ToolResultContentWidget
            content={ToolResultDisplayContentStub({
              value: '> @dungeonmaster/web@1.0.0 build\n> tsc\n\ndone in 4s',
            })}
            color={DIM}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').textContent).toBe(
        '> @dungeonmaster/web@1.0.0 build\n> tsc\n\ndone in 4s',
      );
      expect(screen.queryAllByTestId('MARKDOWN_TEXT')).toStrictEqual([]);
    });

    it('VALID: {verbatim reply, fontSize omitted} => renders at the markdown body size', () => {
      ToolResultContentWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ToolResultContentWidget
            content={ToolResultDisplayContentStub({ value: 'short' })}
            color={DIM}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_RESULT_VERBATIM').style.fontSize).toBe('12px');
    });
  });

  describe('a JSON reply carrying an escaped document', () => {
    it('VALID: {scalars beside a markdown property} => captions the document and inlines the scalars', () => {
      ToolResultContentWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ToolResultContentWidget
            content={ToolResultDisplayContentStub({
              value: JSON.stringify({
                name: 'codeweaver',
                model: 'sonnet',
                prompt: '# Operator\n\nYou own ONE operation item.',
              }),
            })}
            color={DIM}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_RESULT_FORMATTED').textContent).toBe(
        'name: codeweavermodel: sonnetpromptOperatorYou own ONE operation item.',
      );
      expect(
        screen.queryAllByTestId('TOOL_RESULT_FIELD_LABEL').map((node) => node.textContent),
      ).toStrictEqual(['prompt']);
    });

    it('VALID: {markdown property} => renders its heading as a heading, not as literal hashes', () => {
      ToolResultContentWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ToolResultContentWidget
            content={ToolResultDisplayContentStub({
              value: JSON.stringify({ prompt: '# Operator\n\nYou own ONE operation item.' }),
            })}
            color={DIM}
          />
        ),
      });

      expect(
        screen.queryAllByTestId('MARKDOWN_HEADING').map((node) => node.textContent),
      ).toStrictEqual(['Operator']);
      expect(
        screen.queryAllByTestId('MARKDOWN_PARAGRAPH').map((node) => node.textContent),
      ).toStrictEqual(['You own ONE operation item.']);
    });

    it('VALID: {multi-line non-markdown property} => breaks its lines without parsing it', () => {
      ToolResultContentWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ToolResultContentWidget
            content={ToolResultDisplayContentStub({
              value: JSON.stringify({ exitCode: 1, stdout: 'building...\nfailed at step 2' }),
            })}
            color={DIM}
          />
        ),
      });

      expect(screen.getByTestId('TOOL_RESULT_FORMATTED').textContent).toBe(
        'exitCode: 1stdoutbuilding...\nfailed at step 2',
      );
      expect(screen.queryAllByTestId('MARKDOWN_TEXT')).toStrictEqual([]);
    });
  });

  describe('a reply whose newlines are structure', () => {
    // `get-quest` renders one contract per line with its properties indented beneath it. Rejoining
    // that the way an agent's hard-wrapped prose wants produced a single run-on sentence with every
    // nesting level flattened out — the whole reason tool results parse with preserveLineBreaks.
    it('VALID: {indented ledger under a heading} => keeps every break and indent', () => {
      ToolResultContentWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ToolResultContentWidget
            content={ToolResultDisplayContentStub({
              value:
                '## Contracts\n\n#health-snapshot — HealthSnapshot (data, new)\n  status: HealthStatus — Literal health marker.\n  uptimeSeconds: UptimeSeconds — Non-negative integer.',
            })}
            color={DIM}
          />
        ),
      });

      expect(
        screen.queryAllByTestId('MARKDOWN_PARAGRAPH').map((node) => node.textContent),
      ).toStrictEqual([
        '#health-snapshot — HealthSnapshot (data, new)\n  status: HealthStatus — Literal health marker.\n  uptimeSeconds: UptimeSeconds — Non-negative integer.',
      ]);
    });

    // textContent reports the newlines whether or not CSS would collapse them, so the style is
    // asserted separately — without pre-wrap the browser renders the run as one line and every
    // assertion above still passes.
    it('VALID: {indented ledger} => the paragraph declares pre-wrap so the browser keeps them', () => {
      ToolResultContentWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ToolResultContentWidget
            content={ToolResultDisplayContentStub({
              value: '## Contracts\n\n#a — one\n  prop: two',
            })}
            color={DIM}
          />
        ),
      });

      expect(screen.getByTestId('MARKDOWN_PARAGRAPH').style.whiteSpace).toBe('pre-wrap');
    });
  });

  describe('a plain markdown reply', () => {
    it('VALID: {markdown document, no JSON} => renders formatted with no caption', () => {
      ToolResultContentWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ToolResultContentWidget
            content={ToolResultDisplayContentStub({
              value: '# Architecture Overview\n\nLLMs squirrel code away.',
            })}
            color={DIM}
          />
        ),
      });

      expect(
        screen.queryAllByTestId('MARKDOWN_HEADING').map((node) => node.textContent),
      ).toStrictEqual(['Architecture Overview']);
      expect(screen.queryAllByTestId('TOOL_RESULT_FIELD_LABEL')).toStrictEqual([]);
    });
  });
});
