import { markdownBlockContract } from './markdown-block-contract';
import {
  MarkdownBlockStub,
  MarkdownCodeBlockStub,
  MarkdownHeadingBlockStub,
  MarkdownListItemBlockStub,
} from './markdown-block.stub';

describe('markdownBlockContract', () => {
  describe('valid inputs', () => {
    it('VALID: {kind: "paragraph"} => parses a paragraph with its spans', () => {
      const result = markdownBlockContract.parse({
        kind: 'paragraph',
        spans: [{ kind: 'text', text: 'plain words' }],
      });

      expect(result).toStrictEqual({
        kind: 'paragraph',
        spans: [{ kind: 'text', text: 'plain words' }],
      });
    });

    it('VALID: {kind: "heading", level: 1} => parses the shallowest heading', () => {
      const result = markdownBlockContract.parse({ kind: 'heading', level: 1, spans: [] });

      expect(result).toStrictEqual({ kind: 'heading', level: 1, spans: [] });
    });

    it('EDGE: {kind: "heading", level: 6} => parses the deepest heading', () => {
      const result = markdownBlockContract.parse({ kind: 'heading', level: 6, spans: [] });

      expect(result).toStrictEqual({ kind: 'heading', level: 6, spans: [] });
    });

    it('VALID: {kind: "list-item"} => parses a marker, depth, and spans', () => {
      const result = markdownBlockContract.parse({
        kind: 'list-item',
        marker: '1.',
        depth: 1,
        spans: [{ kind: 'text', text: 'first item' }],
      });

      expect(result).toStrictEqual({
        kind: 'list-item',
        marker: '1.',
        depth: 1,
        spans: [{ kind: 'text', text: 'first item' }],
      });
    });

    it('VALID: {kind: "quote"} => parses a blockquote', () => {
      const result = markdownBlockContract.parse({
        kind: 'quote',
        spans: [{ kind: 'text', text: 'quoted' }],
      });

      expect(result).toStrictEqual({ kind: 'quote', spans: [{ kind: 'text', text: 'quoted' }] });
    });

    it('VALID: {kind: "code-block"} => parses a fenced block with its language', () => {
      const result = markdownBlockContract.parse({
        kind: 'code-block',
        language: 'typescript',
        content: 'const x = 1;',
      });

      expect(result).toStrictEqual({
        kind: 'code-block',
        language: 'typescript',
        content: 'const x = 1;',
      });
    });

    it('EMPTY: {kind: "code-block", language: ""} => parses an unlabelled fence', () => {
      const result = markdownBlockContract.parse({
        kind: 'code-block',
        language: '',
        content: '',
      });

      expect(result).toStrictEqual({ kind: 'code-block', language: '', content: '' });
    });

    it('VALID: {kind: "rule"} => parses a horizontal rule', () => {
      const result = markdownBlockContract.parse({ kind: 'rule' });

      expect(result).toStrictEqual({ kind: 'rule' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {kind: "table"} => throws for a block outside the dialect', () => {
      expect(() => markdownBlockContract.parse({ kind: 'table', spans: [] })).toThrow(
        /Invalid discriminator value/u,
      );
    });

    it('INVALID: {kind: "heading", level: 7} => throws past the deepest heading', () => {
      expect(() => markdownBlockContract.parse({ kind: 'heading', level: 7, spans: [] })).toThrow(
        /less than or equal to 6/u,
      );
    });

    it('INVALID: {kind: "heading", level: 0} => throws below the shallowest heading', () => {
      expect(() => markdownBlockContract.parse({ kind: 'heading', level: 0, spans: [] })).toThrow(
        /greater than or equal to 1/u,
      );
    });

    it('INVALID: {kind: "list-item", depth: 4} => throws past the indent clamp', () => {
      expect(() =>
        markdownBlockContract.parse({ kind: 'list-item', marker: '•', depth: 4, spans: [] }),
      ).toThrow(/less than or equal to 3/u);
    });

    it('INVALID: {kind: "list-item", marker: ""} => throws for a markerless item', () => {
      expect(() =>
        markdownBlockContract.parse({ kind: 'list-item', marker: '', depth: 0, spans: [] }),
      ).toThrow(/String must contain at least 1 character/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => markdownBlockContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stubs', () => {
    it('VALID: {default} => creates a paragraph block', () => {
      const result = MarkdownBlockStub();

      expect(result).toStrictEqual({
        kind: 'paragraph',
        spans: [{ kind: 'text', text: 'plain words' }],
      });
    });

    it('VALID: {heading stub default} => creates a level-2 heading', () => {
      const result = MarkdownHeadingBlockStub();

      expect(result).toStrictEqual({
        kind: 'heading',
        level: 2,
        spans: [{ kind: 'text', text: 'Gate 5' }],
      });
    });

    it('VALID: {list-item stub with custom depth} => creates a nested item', () => {
      const result = MarkdownListItemBlockStub({ depth: 2 } as never);

      expect(result).toStrictEqual({
        kind: 'list-item',
        marker: '•',
        depth: 2,
        spans: [{ kind: 'text', text: 'first item' }],
      });
    });

    it('VALID: {code-block stub default} => creates a typescript fence', () => {
      const result = MarkdownCodeBlockStub();

      expect(result).toStrictEqual({
        kind: 'code-block',
        language: 'typescript',
        content: 'const x = 1;',
      });
    });
  });
});
