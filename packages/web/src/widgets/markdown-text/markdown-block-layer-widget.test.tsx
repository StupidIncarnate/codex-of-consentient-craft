import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  MarkdownBlockStub,
  MarkdownCodeBlockStub,
  MarkdownHeadingBlockStub,
  MarkdownListItemBlockStub,
} from '../../contracts/markdown-block/markdown-block.stub';
import { MarkdownBlockLayerWidget } from './markdown-block-layer-widget';
import { MarkdownBlockLayerWidgetProxy } from './markdown-block-layer-widget.proxy';

describe('MarkdownBlockLayerWidget', () => {
  describe('paragraphs', () => {
    it('VALID: {kind: paragraph} => renders its spans', () => {
      MarkdownBlockLayerWidgetProxy();

      mantineRenderAdapter({ ui: <MarkdownBlockLayerWidget block={MarkdownBlockStub()} /> });

      expect(screen.getByTestId('MARKDOWN_PARAGRAPH').textContent).toBe('plain words');
    });
  });

  describe('headings', () => {
    it('VALID: {level: 1} => renders three points above body size', () => {
      MarkdownBlockLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownBlockLayerWidget block={MarkdownHeadingBlockStub({ level: 1 } as never)} />,
      });

      const heading = screen.getByTestId('MARKDOWN_HEADING');

      expect({ text: heading.textContent, size: heading.style.fontSize }).toStrictEqual({
        text: 'Gate 5',
        size: '15px',
      });
    });

    it('VALID: {level: 3} => renders one point above body size', () => {
      MarkdownBlockLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownBlockLayerWidget block={MarkdownHeadingBlockStub({ level: 3 } as never)} />,
      });

      expect(screen.getByTestId('MARKDOWN_HEADING').style.fontSize).toBe('13px');
    });

    it('EDGE: {level: 6} => flattens to body size', () => {
      MarkdownBlockLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownBlockLayerWidget block={MarkdownHeadingBlockStub({ level: 6 } as never)} />,
      });

      expect(screen.getByTestId('MARKDOWN_HEADING').style.fontSize).toBe('12px');
    });
  });

  describe('list items', () => {
    it('VALID: {depth: 0} => renders the marker beside the text with no indent', () => {
      MarkdownBlockLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownBlockLayerWidget block={MarkdownListItemBlockStub()} />,
      });

      const item = screen.getByTestId('MARKDOWN_LIST_ITEM');
      const marker = screen.getByTestId('MARKDOWN_LIST_MARKER');

      expect({
        marker: marker.textContent,
        text: item.textContent,
        indent: item.style.paddingLeft,
      }).toStrictEqual({ marker: '•', text: '•first item', indent: '0px' });
    });

    it('VALID: {depth: 2} => indents by two steps', () => {
      MarkdownBlockLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownBlockLayerWidget block={MarkdownListItemBlockStub({ depth: 2 } as never)} />,
      });

      expect(screen.getByTestId('MARKDOWN_LIST_ITEM').style.paddingLeft).toBe('24px');
    });
  });

  describe('code blocks', () => {
    it('VALID: {kind: code-block} => renders the content with newlines preserved', () => {
      MarkdownBlockLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MarkdownBlockLayerWidget
            block={MarkdownCodeBlockStub({ content: 'line one\nline two' } as never)}
          />
        ),
      });

      const fence = screen.getByTestId('MARKDOWN_CODE_BLOCK');

      expect({
        text: fence.textContent,
        background: fence.style.backgroundColor,
        border: fence.style.border,
      }).toStrictEqual({
        text: 'line one\nline two',
        background: 'rgb(42, 26, 20)',
        border: '1px solid rgb(138, 114, 96)',
      });
    });
  });

  describe('quotes and rules', () => {
    it('VALID: {kind: quote} => renders its spans behind a left border', () => {
      MarkdownBlockLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MarkdownBlockLayerWidget
            block={MarkdownBlockStub({
              kind: 'quote',
              spans: [{ kind: 'text', text: 'quoted' }],
            } as never)}
          />
        ),
      });

      const quote = screen.getByTestId('MARKDOWN_QUOTE');

      expect({ text: quote.textContent, border: quote.style.borderLeft }).toStrictEqual({
        text: 'quoted',
        border: '2px solid rgb(61, 42, 30)',
      });
    });

    it('VALID: {kind: rule} => renders an empty hairline', () => {
      MarkdownBlockLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownBlockLayerWidget block={MarkdownBlockStub({ kind: 'rule' } as never)} />,
      });

      const rule = screen.getByTestId('MARKDOWN_RULE');

      expect({ text: rule.textContent, border: rule.style.borderTop }).toStrictEqual({
        text: '',
        border: '1px solid rgb(61, 42, 30)',
      });
    });
  });
});
