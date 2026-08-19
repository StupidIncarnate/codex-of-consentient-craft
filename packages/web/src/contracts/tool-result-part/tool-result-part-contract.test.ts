import { toolResultPartContract } from './tool-result-part-contract';
import { ToolResultMarkdownPartStub, ToolResultPartStub } from './tool-result-part.stub';

describe('toolResultPartContract', () => {
  describe('text parts', () => {
    it('VALID: {kind: text, no label} => parses as the whole-reply unit', () => {
      const part = ToolResultPartStub();

      expect(part).toStrictEqual({ kind: 'text', text: 'file contents here' });
    });

    it('VALID: {kind: text, label} => keeps the property name it was captioned with', () => {
      const part = ToolResultPartStub({ label: 'model', text: 'sonnet' });

      expect(part).toStrictEqual({ kind: 'text', label: 'model', text: 'sonnet' });
    });
  });

  describe('markdown parts', () => {
    it('VALID: {kind: markdown, label, source} => parses with the document intact', () => {
      const part = ToolResultMarkdownPartStub();

      expect(part).toStrictEqual({
        kind: 'markdown',
        label: 'prompt',
        source: '# Operator\n\nYou own ONE operation item.',
      });
    });
  });

  describe('invalid parts', () => {
    it('INVALID: {kind: heading} => throws on an unknown discriminant', () => {
      expect(() => {
        toolResultPartContract.parse({ kind: 'heading', text: 'x' });
      }).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {kind: markdown, no source} => throws on the missing document', () => {
      expect(() => {
        toolResultPartContract.parse({ kind: 'markdown' });
      }).toThrow(/Required/u);
    });
  });
});
