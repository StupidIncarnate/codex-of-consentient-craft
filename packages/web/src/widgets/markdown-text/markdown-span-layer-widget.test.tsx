import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  MarkdownBoldSpanStub,
  MarkdownCodeSpanStub,
  MarkdownLinkSpanStub,
  MarkdownSpanStub,
} from '../../contracts/markdown-span/markdown-span.stub';
import { MarkdownSpanLayerWidget } from './markdown-span-layer-widget';
import { MarkdownSpanLayerWidgetProxy } from './markdown-span-layer-widget.proxy';

describe('MarkdownSpanLayerWidget', () => {
  describe('text spans', () => {
    it('VALID: {kind: text} => renders the run as an inline span', () => {
      MarkdownSpanLayerWidgetProxy();

      mantineRenderAdapter({ ui: <MarkdownSpanLayerWidget span={MarkdownSpanStub()} /> });

      const span = screen.getByTestId('MARKDOWN_TEXT_SPAN');

      expect({ text: span.textContent, tag: span.tagName }).toStrictEqual({
        text: 'plain words',
        tag: 'SPAN',
      });
    });
  });

  describe('code spans', () => {
    it('VALID: {kind: code} => marks code with the inset chip and body text, not an accent colour', () => {
      MarkdownSpanLayerWidgetProxy();

      mantineRenderAdapter({ ui: <MarkdownSpanLayerWidget span={MarkdownCodeSpanStub()} /> });

      const span = screen.getByTestId('MARKDOWN_CODE');

      expect({
        text: span.textContent,
        tag: span.tagName,
        background: span.style.backgroundColor,
        border: span.style.border,
        color: span.style.color,
      }).toStrictEqual({
        text: 'navigationHarness',
        tag: 'CODE',
        // bg-raised (#2a1a14) sits at 1.13:1 against the bg-surface a message renders over — a
        // fill that paints and cannot be seen. This pins the chip above that floor.
        background: 'rgb(61, 42, 30)',
        border: '1px solid rgb(138, 114, 96)',
        color: 'rgb(224, 207, 192)',
      });
    });
  });

  describe('bold and italic spans', () => {
    it('VALID: {kind: bold} => renders at the bold weight', () => {
      MarkdownSpanLayerWidgetProxy();

      mantineRenderAdapter({ ui: <MarkdownSpanLayerWidget span={MarkdownBoldSpanStub()} /> });

      const span = screen.getByTestId('MARKDOWN_BOLD');

      expect({ text: span.textContent, weight: span.style.fontWeight }).toStrictEqual({
        text: 'important',
        weight: '700',
      });
    });

    it('VALID: {kind: italic} => renders in italic', () => {
      MarkdownSpanLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <MarkdownSpanLayerWidget span={MarkdownSpanStub({ kind: 'italic' } as never)} />,
      });

      const span = screen.getByTestId('MARKDOWN_ITALIC');

      expect({ text: span.textContent, style: span.style.fontStyle }).toStrictEqual({
        text: 'plain words',
        style: 'italic',
      });
    });
  });

  describe('link spans', () => {
    it('VALID: {kind: link} => renders an anchor carrying the href and a safe target', () => {
      MarkdownSpanLayerWidgetProxy();

      mantineRenderAdapter({ ui: <MarkdownSpanLayerWidget span={MarkdownLinkSpanStub()} /> });

      const span = screen.getByTestId('MARKDOWN_LINK');

      expect({
        text: span.textContent,
        href: span.getAttribute('href'),
        rel: span.getAttribute('rel'),
        target: span.getAttribute('target'),
      }).toStrictEqual({
        text: 'the docs',
        href: 'https://example.com',
        rel: 'noreferrer',
        target: '_blank',
      });
    });
  });
});
