import { mermaidRenderAdapterProxy } from '../../adapters/mermaid/render/mermaid-render-adapter.proxy';
import { panzoomCreateAdapterProxy } from '../../adapters/panzoom/create/panzoom-create-adapter.proxy';
import type { SvgMarkupStub } from '../../contracts/svg-markup/svg-markup.stub';

type SvgMarkup = ReturnType<typeof SvgMarkupStub>;

export const MermaidDiagramWidgetProxy = (): {
  setupRender: ({ svg }: { svg: SvgMarkup }) => void;
  setupError: ({ error }: { error: Error }) => void;
  getPanzoomInstance: () => {
    zoomIn: jest.Mock;
    zoomOut: jest.Mock;
    reset: jest.Mock;
    destroy: jest.Mock;
  };
} => {
  const adapterProxy = mermaidRenderAdapterProxy();
  const panzoomProxy = panzoomCreateAdapterProxy();

  return {
    setupRender: ({ svg }: { svg: SvgMarkup }) => {
      adapterProxy.returns({ svg });
    },
    setupError: ({ error }: { error: Error }) => {
      adapterProxy.throws({ error });
    },
    getPanzoomInstance: () => panzoomProxy.getInstance(),
  };
};
