import { mermaidRenderAdapterProxy } from '../../adapters/mermaid/render/mermaid-render-adapter.proxy';
import type { SvgMarkupStub } from '../../contracts/svg-markup/svg-markup.stub';

type SvgMarkup = ReturnType<typeof SvgMarkupStub>;

export const MermaidDiagramWidgetProxy = (): {
  setupRender: ({ svg }: { svg: SvgMarkup }) => void;
  setupError: ({ error }: { error: Error }) => void;
} => {
  const adapterProxy = mermaidRenderAdapterProxy();

  return {
    setupRender: ({ svg }: { svg: SvgMarkup }) => {
      adapterProxy.returns({ svg });
    },
    setupError: ({ error }: { error: Error }) => {
      adapterProxy.throws({ error });
    },
  };
};
