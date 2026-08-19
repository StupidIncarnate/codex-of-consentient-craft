import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { MarkdownSourceStub } from '../../contracts/markdown-source/markdown-source.stub';
import { MarkdownTextWidget } from './markdown-text-widget';
import { MarkdownTextWidgetProxy } from './markdown-text-widget.proxy';

describe('MarkdownTextWidget', () => {
  describe('plain prose', () => {
    it('VALID: {unmarked text} => renders one paragraph', () => {
      MarkdownTextWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownTextWidget content={MarkdownSourceStub({ value: 'Gate 4 complete.' })} />,
      });

      expect(
        screen.queryAllByTestId('MARKDOWN_PARAGRAPH').map((node) => node.textContent),
      ).toStrictEqual(['Gate 4 complete.']);
    });

    it('EMPTY: {content: ""} => renders the container with no blocks', () => {
      MarkdownTextWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownTextWidget content={MarkdownSourceStub({ value: '' })} />,
      });

      expect(screen.getByTestId('MARKDOWN_TEXT').textContent).toBe('');
    });
  });

  describe('inline marks', () => {
    it('VALID: {backticked identifier} => renders it as a code span, not literal backticks', () => {
      MarkdownTextWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MarkdownTextWidget
            content={MarkdownSourceStub({ value: 'both import `navigationHarness` now' })}
          />
        ),
      });

      expect(
        screen.queryAllByTestId('MARKDOWN_CODE').map((node) => node.textContent),
      ).toStrictEqual(['navigationHarness']);
    });

    it('VALID: {bold run} => renders it at the bold weight, not with literal asterisks', () => {
      MarkdownTextWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownTextWidget content={MarkdownSourceStub({ value: 'this is **important**' })} />,
      });

      expect(
        screen.queryAllByTestId('MARKDOWN_BOLD').map((node) => node.textContent),
      ).toStrictEqual(['important']);
    });

    it('VALID: {marked-up paragraph} => renders the sentence with its syntax stripped', () => {
      MarkdownTextWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MarkdownTextWidget
            content={MarkdownSourceStub({ value: 'the `nav` const is **shared**' })}
          />
        ),
      });

      expect(screen.getByTestId('MARKDOWN_TEXT').textContent).toBe('the nav const is shared');
    });
  });

  describe('block structure', () => {
    it('VALID: {heading, prose, list and fence} => renders every block in source order', () => {
      MarkdownTextWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MarkdownTextWidget
            content={MarkdownSourceStub({
              value:
                '## Gate 5\n\nAll claims verified.\n\n- first\n- second\n\n```sh\nnpm run ward\n```',
            })}
          />
        ),
      });

      expect({
        headings: screen.queryAllByTestId('MARKDOWN_HEADING').map((node) => node.textContent),
        paragraphs: screen.queryAllByTestId('MARKDOWN_PARAGRAPH').map((node) => node.textContent),
        items: screen.queryAllByTestId('MARKDOWN_LIST_ITEM').map((node) => node.textContent),
        fences: screen.queryAllByTestId('MARKDOWN_CODE_BLOCK').map((node) => node.textContent),
      }).toStrictEqual({
        headings: ['Gate 5'],
        paragraphs: ['All claims verified.'],
        items: ['•first', '•second'],
        fences: ['npm run ward'],
      });
    });

    it('VALID: {document opening on a heading, another below} => only the opening one loses its gap', () => {
      MarkdownTextWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MarkdownTextWidget
            content={MarkdownSourceStub({ value: '# Title\n\nProse.\n\n## Section' })}
          />
        ),
      });

      expect(
        screen.queryAllByTestId('MARKDOWN_HEADING').map((node) => node.style.marginTop),
      ).toStrictEqual(['0px', '12px']);
    });

    it('EDGE: {markdown syntax inside a fence} => renders it verbatim rather than as structure', () => {
      MarkdownTextWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MarkdownTextWidget
            content={MarkdownSourceStub({ value: '```\n# not a heading\n```' })}
          />
        ),
      });

      expect({
        headings: screen.queryAllByTestId('MARKDOWN_HEADING').map((node) => node.textContent),
        fences: screen.queryAllByTestId('MARKDOWN_CODE_BLOCK').map((node) => node.textContent),
      }).toStrictEqual({ headings: [], fences: ['# not a heading'] });
    });
  });
});
