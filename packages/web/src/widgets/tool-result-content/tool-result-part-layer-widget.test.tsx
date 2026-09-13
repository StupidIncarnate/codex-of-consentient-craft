import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CssPixelsStub } from '@dungeonmaster/shared/contracts';
import {
  ToolResultMarkdownPartStub,
  ToolResultPartStub,
} from '../../contracts/tool-result-part/tool-result-part.stub';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ToolResultPartLayerWidget } from './tool-result-part-layer-widget';
import { ToolResultPartLayerWidgetProxy } from './tool-result-part-layer-widget.proxy';

const DIM = emberDepthsThemeStatics.colors['text-dim'];
const FONT_SIZE = CssPixelsStub({ value: 12 });

describe('ToolResultPartLayerWidget', () => {
  describe('text part, no label', () => {
    it('VALID: {kind: text, no label} => renders the text with no caption', () => {
      ToolResultPartLayerWidgetProxy();
      const part = ToolResultPartStub({ text: 'file contents here' });

      mantineRenderAdapter({
        ui: <ToolResultPartLayerWidget part={part} color={DIM} fontSize={FONT_SIZE} />,
      });

      expect(screen.queryByTestId('TOOL_RESULT_FIELD_LABEL')).toBe(null);
      expect(screen.getByTestId('TOOL_RESULT_PART').textContent).toBe('file contents here');
    });
  });

  describe('text part, single-line value', () => {
    it('VALID: {label, single-line text} => inlines "label: value" with no separate caption', () => {
      ToolResultPartLayerWidgetProxy();
      const part = ToolResultPartStub({ label: 'model', text: 'sonnet' });

      mantineRenderAdapter({
        ui: <ToolResultPartLayerWidget part={part} color={DIM} fontSize={FONT_SIZE} />,
      });

      expect(screen.queryByTestId('TOOL_RESULT_FIELD_LABEL')).toBe(null);
      expect(screen.getByTestId('TOOL_RESULT_PART').textContent).toBe('model: sonnet');
    });
  });

  describe('text part, multi-line value', () => {
    it('VALID: {label, multi-line text} => captions the field, sized to the given fontSize, and keeps the text unprefixed', () => {
      ToolResultPartLayerWidgetProxy();
      const part = ToolResultPartStub({ label: 'stdout', text: 'building...\nfailed at step 2' });

      mantineRenderAdapter({
        ui: <ToolResultPartLayerWidget part={part} color={DIM} fontSize={FONT_SIZE} />,
      });

      const label = screen.getByTestId('TOOL_RESULT_FIELD_LABEL');

      expect([label.textContent, label.style.fontSize]).toStrictEqual(['stdout', '12px']);
      expect(screen.getByTestId('TOOL_RESULT_PART').textContent).toBe(
        'stdoutbuilding...\nfailed at step 2',
      );
    });
  });

  describe('markdown part', () => {
    it('VALID: {label, markdown source} => captions the field and renders the document formatted', () => {
      ToolResultPartLayerWidgetProxy();
      const part = ToolResultMarkdownPartStub({
        label: 'prompt',
        source: '# Operator\n\nYou own ONE operation item.',
      });

      mantineRenderAdapter({
        ui: <ToolResultPartLayerWidget part={part} color={DIM} fontSize={FONT_SIZE} />,
      });

      expect(screen.getByTestId('TOOL_RESULT_FIELD_LABEL').textContent).toBe('prompt');
      expect(screen.getByTestId('MARKDOWN_HEADING').textContent).toBe('Operator');
    });

    it('VALID: {no label, markdown source} => renders the document with no caption', () => {
      ToolResultPartLayerWidgetProxy();
      const part = ToolResultMarkdownPartStub({
        label: undefined,
        source: '# Architecture Overview\n\nLLMs squirrel code away.',
      });

      mantineRenderAdapter({
        ui: <ToolResultPartLayerWidget part={part} color={DIM} fontSize={FONT_SIZE} />,
      });

      expect(screen.queryByTestId('TOOL_RESULT_FIELD_LABEL')).toBe(null);
      expect(screen.getByTestId('MARKDOWN_HEADING').textContent).toBe('Architecture Overview');
    });
  });
});
