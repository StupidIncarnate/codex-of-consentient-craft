import mermaid from 'mermaid';

import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { SvgMarkupStub } from '../../../contracts/svg-markup/svg-markup.stub';

registerModuleMock({
  module: 'mermaid',
  factory: () => ({
    __esModule: true,
    default: {
      initialize: jest.fn(),
      render: jest.fn(),
    },
  }),
});

type SvgMarkup = ReturnType<typeof SvgMarkupStub>;

export const mermaidRenderAdapterProxy = (): {
  returns: ({ svg }: { svg: SvgMarkup }) => void;
  setupError: ({ error }: { error: unknown }) => void;
} => {
  const mockRender = registerMock({ fn: mermaid.render });

  mockRender.mockResolvedValue({ svg: SvgMarkupStub() } as never);

  return {
    returns: ({ svg }: { svg: SvgMarkup }) => {
      mockRender.mockResolvedValueOnce({ svg } as never);
    },
    setupError: ({ error }: { error: unknown }) => {
      // Use mockImplementationOnce to preserve raw rejection value (including non-Error types)
      // mockRejectedValueOnce wraps non-Errors in new Error(), which changes behavior
      mockRender.mockImplementationOnce(async () => Promise.reject(error as Error));
    },
  };
};
