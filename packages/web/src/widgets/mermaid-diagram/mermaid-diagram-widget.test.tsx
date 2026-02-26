import { screen, waitFor } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { MermaidDefinitionStub } from '../../contracts/mermaid-definition/mermaid-definition.stub';
import { SvgMarkupStub } from '../../contracts/svg-markup/svg-markup.stub';
import { MermaidDiagramWidget } from './mermaid-diagram-widget';
import { MermaidDiagramWidgetProxy } from './mermaid-diagram-widget.proxy';

describe('MermaidDiagramWidget', () => {
  describe('successful render', () => {
    it('VALID: {diagram definition} => renders svg into container', async () => {
      const proxy = MermaidDiagramWidgetProxy();
      const diagram = MermaidDefinitionStub({ value: 'graph TD; A-->B' });
      const svg = SvgMarkupStub({ value: '<svg><text>rendered</text></svg>' });

      proxy.setupRender({ svg });

      mantineRenderAdapter({ ui: <MermaidDiagramWidget diagram={diagram} /> });

      await waitFor(() => {
        expect(screen.getByTestId('MERMAID_CONTAINER').innerHTML).toBe(
          '<svg><text>rendered</text></svg>',
        );
      });

      expect(screen.getByTestId('MERMAID_CONTAINER').innerHTML).toBe(
        '<svg><text>rendered</text></svg>',
      );
    });
  });

  describe('error handling', () => {
    it('ERROR: {render fails} => shows error message', async () => {
      const proxy = MermaidDiagramWidgetProxy();
      const diagram = MermaidDefinitionStub({ value: 'invalid syntax' });

      proxy.setupError({ error: new Error('Parse error in diagram') });

      mantineRenderAdapter({ ui: <MermaidDiagramWidget diagram={diagram} /> });

      await waitFor(() => {
        expect(screen.getByTestId('MERMAID_ERROR').textContent).toBe('Parse error in diagram');
      });

      expect(screen.getByTestId('MERMAID_ERROR').textContent).toBe('Parse error in diagram');
    });

    it('ERROR: {non-Error thrown} => shows fallback message', async () => {
      const proxy = MermaidDiagramWidgetProxy();
      const diagram = MermaidDefinitionStub({ value: 'bad' });

      proxy.setupError({ error: 'not an error object' as never });

      mantineRenderAdapter({ ui: <MermaidDiagramWidget diagram={diagram} /> });

      await waitFor(() => {
        expect(screen.getByTestId('MERMAID_ERROR').textContent).toBe('Failed to render diagram');
      });

      expect(screen.getByTestId('MERMAID_ERROR').textContent).toBe('Failed to render diagram');
    });
  });
});
