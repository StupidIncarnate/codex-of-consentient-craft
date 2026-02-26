import mermaid from 'mermaid';

import { SvgMarkupStub } from '../../../contracts/svg-markup/svg-markup.stub';

jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn(),
  },
}));

type SvgMarkup = ReturnType<typeof SvgMarkupStub>;

export const mermaidRenderAdapterProxy = (): {
  returns: ({ svg }: { svg: SvgMarkup }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const mockRender = jest.mocked(mermaid.render);

  mockRender.mockResolvedValue({ svg: SvgMarkupStub() } as never);

  return {
    returns: ({ svg }: { svg: SvgMarkup }) => {
      mockRender.mockResolvedValueOnce({ svg } as never);
    },
    throws: ({ error }: { error: Error }) => {
      mockRender.mockRejectedValueOnce(error);
    },
  };
};
