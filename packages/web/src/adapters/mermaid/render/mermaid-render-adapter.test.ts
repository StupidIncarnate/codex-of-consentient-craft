import { SvgMarkupStub } from '../../../contracts/svg-markup/svg-markup.stub';
import { mermaidRenderAdapter } from './mermaid-render-adapter';
import { mermaidRenderAdapterProxy } from './mermaid-render-adapter.proxy';

describe('mermaidRenderAdapter', () => {
  describe('successful renders', () => {
    it('VALID: {definition: "graph TD; A-->B"} => returns svg markup', async () => {
      const proxy = mermaidRenderAdapterProxy();
      const expectedSvg = SvgMarkupStub({ value: '<svg>rendered</svg>' });

      proxy.returns({ svg: expectedSvg });

      const result = await mermaidRenderAdapter({
        id: 'test-diagram',
        definition: 'graph TD; A-->B',
      });

      expect(result).toBe('<svg>rendered</svg>');
    });
  });

  describe('error cases', () => {
    it('ERROR: {invalid definition} => throws render error', async () => {
      const proxy = mermaidRenderAdapterProxy();

      proxy.throws({ error: new Error('Parse error') });

      await expect(
        mermaidRenderAdapter({ id: 'bad-diagram', definition: 'invalid' }),
      ).rejects.toThrow(/Parse error/u);
    });
  });
});
