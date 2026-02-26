import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
        expect(screen.getByText('rendered')).toBeInTheDocument();
      });

      expect(screen.getByText('rendered')).toBeInTheDocument();
    });
  });

  describe('zoom controls', () => {
    it('VALID: {zoom in clicked} => delegates to panzoom zoomIn', async () => {
      const user = userEvent.setup();
      const proxy = MermaidDiagramWidgetProxy();
      const diagram = MermaidDefinitionStub({ value: 'graph TD; A-->B' });
      const svg = SvgMarkupStub({ value: '<svg><text>diagram</text></svg>' });

      proxy.setupRender({ svg });

      mantineRenderAdapter({ ui: <MermaidDiagramWidget diagram={diagram} /> });

      await waitFor(() => {
        expect(screen.getByTestId('ZOOM_IN_BUTTON')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('ZOOM_IN_BUTTON'));

      expect(proxy.getPanzoomInstance().zoomIn).toHaveBeenCalledTimes(1);
    });

    it('VALID: {zoom out clicked} => delegates to panzoom zoomOut', async () => {
      const user = userEvent.setup();
      const proxy = MermaidDiagramWidgetProxy();
      const diagram = MermaidDefinitionStub({ value: 'graph TD; A-->B' });
      const svg = SvgMarkupStub({ value: '<svg><text>diagram</text></svg>' });

      proxy.setupRender({ svg });

      mantineRenderAdapter({ ui: <MermaidDiagramWidget diagram={diagram} /> });

      await waitFor(() => {
        expect(screen.getByTestId('ZOOM_OUT_BUTTON')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('ZOOM_OUT_BUTTON'));

      expect(proxy.getPanzoomInstance().zoomOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('fullscreen', () => {
    it('VALID: {fullscreen clicked} => opens modal with diagram', async () => {
      const user = userEvent.setup();
      const proxy = MermaidDiagramWidgetProxy();
      const diagram = MermaidDefinitionStub({ value: 'graph TD; A-->B' });
      const svg = SvgMarkupStub({ value: '<svg><text>fullscreen-diagram</text></svg>' });

      proxy.setupRender({ svg });

      mantineRenderAdapter({ ui: <MermaidDiagramWidget diagram={diagram} /> });

      await waitFor(() => {
        expect(screen.getByTestId('FULLSCREEN_BUTTON')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('FULLSCREEN_BUTTON'));

      await waitFor(() => {
        expect(screen.getByTestId('MODAL_DIAGRAM_CONTAINER')).toBeInTheDocument();
      });

      const modalContainer = screen.getByTestId('MODAL_DIAGRAM_CONTAINER');

      expect(modalContainer.innerHTML.length).toBeGreaterThan(0);
    });

    it('VALID: {modal close clicked} => closes modal', async () => {
      const user = userEvent.setup();
      const proxy = MermaidDiagramWidgetProxy();
      const diagram = MermaidDefinitionStub({ value: 'graph TD; A-->B' });
      const svg = SvgMarkupStub({ value: '<svg><text>diagram</text></svg>' });

      proxy.setupRender({ svg });

      mantineRenderAdapter({ ui: <MermaidDiagramWidget diagram={diagram} /> });

      await waitFor(() => {
        expect(screen.getByTestId('FULLSCREEN_BUTTON')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('FULLSCREEN_BUTTON'));

      await waitFor(() => {
        expect(screen.getByTestId('MODAL_CLOSE_BUTTON')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('MODAL_CLOSE_BUTTON'));

      await waitFor(() => {
        expect(screen.queryByTestId('MODAL_DIAGRAM_CONTAINER')).not.toBeInTheDocument();
      });

      expect(screen.queryByTestId('MODAL_DIAGRAM_CONTAINER')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('ERROR: {render fails} => shows error message', async () => {
      const proxy = MermaidDiagramWidgetProxy();
      const diagram = MermaidDefinitionStub({ value: 'invalid syntax' });

      proxy.setupError({ error: new Error('Parse error in diagram') });

      mantineRenderAdapter({ ui: <MermaidDiagramWidget diagram={diagram} /> });

      await waitFor(() => {
        expect(screen.getByTestId('MERMAID_ERROR')).toBeInTheDocument();
      });

      expect(screen.getByTestId('MERMAID_ERROR').textContent).toBe('Parse error in diagram');
    });

    it('ERROR: {non-Error thrown} => shows fallback message', async () => {
      const proxy = MermaidDiagramWidgetProxy();
      const diagram = MermaidDefinitionStub({ value: 'bad' });

      proxy.setupError({ error: 'not an error object' as never });

      mantineRenderAdapter({ ui: <MermaidDiagramWidget diagram={diagram} /> });

      await waitFor(() => {
        expect(screen.getByTestId('MERMAID_ERROR')).toBeInTheDocument();
      });

      expect(screen.getByTestId('MERMAID_ERROR').textContent).toBe('Failed to render diagram');
    });
  });
});
