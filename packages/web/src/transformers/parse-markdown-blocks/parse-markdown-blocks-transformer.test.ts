import { parseMarkdownBlocksTransformer } from './parse-markdown-blocks-transformer';
import { parseMarkdownBlocksTransformerProxy } from './parse-markdown-blocks-transformer.proxy';

describe('parseMarkdownBlocksTransformer', () => {
  describe('paragraphs', () => {
    it('VALID: {single line} => returns one paragraph', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: 'Gate 4 complete.' });

      expect(result).toStrictEqual([
        { kind: 'paragraph', spans: [{ kind: 'text', text: 'Gate 4 complete.' }] },
      ]);
    });

    it('VALID: {hard-wrapped prose} => rejoins the wrap into one paragraph', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({
        text: 'Crosscut minion confirms the diff\nis internally consistent.',
      });

      expect(result).toStrictEqual([
        {
          kind: 'paragraph',
          spans: [
            { kind: 'text', text: 'Crosscut minion confirms the diff is internally consistent.' },
          ],
        },
      ]);
    });

    it('VALID: {blank line between prose} => splits into two paragraphs', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: 'first\n\nsecond' });

      expect(result).toStrictEqual([
        { kind: 'paragraph', spans: [{ kind: 'text', text: 'first' }] },
        { kind: 'paragraph', spans: [{ kind: 'text', text: 'second' }] },
      ]);
    });

    it('EMPTY: {text: ""} => returns no blocks', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '' });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {only blank lines} => returns no blocks', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '\n  \n\n' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('headings', () => {
    it('VALID: {## heading} => returns a level-2 heading with parsed spans', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '## Gate **5**' });

      expect(result).toStrictEqual([
        {
          kind: 'heading',
          level: 2,
          spans: [
            { kind: 'text', text: 'Gate ' },
            { kind: 'bold', text: '5' },
          ],
        },
      ]);
    });

    it('VALID: {heading then prose} => flushes the heading before the paragraph', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '# Title\nbody text' });

      expect(result).toStrictEqual([
        { kind: 'heading', level: 1, spans: [{ kind: 'text', text: 'Title' }] },
        { kind: 'paragraph', spans: [{ kind: 'text', text: 'body text' }] },
      ]);
    });

    it('EDGE: {prose then heading} => flushes the pending paragraph first', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: 'body text\n# Title' });

      expect(result).toStrictEqual([
        { kind: 'paragraph', spans: [{ kind: 'text', text: 'body text' }] },
        { kind: 'heading', level: 1, spans: [{ kind: 'text', text: 'Title' }] },
      ]);
    });

    it('EDGE: {hash with no space} => treated as prose, not a heading', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '#hashtag' });

      expect(result).toStrictEqual([
        { kind: 'paragraph', spans: [{ kind: 'text', text: '#hashtag' }] },
      ]);
    });
  });

  describe('lists', () => {
    it('VALID: {bullet list} => returns one block per item with the bullet glyph', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '- first\n- second' });

      expect(result).toStrictEqual([
        { kind: 'list-item', marker: '•', depth: 0, spans: [{ kind: 'text', text: 'first' }] },
        { kind: 'list-item', marker: '•', depth: 0, spans: [{ kind: 'text', text: 'second' }] },
      ]);
    });

    it('VALID: {ordered list} => keeps the source marker', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '1. first\n2. second' });

      expect(result).toStrictEqual([
        { kind: 'list-item', marker: '1.', depth: 0, spans: [{ kind: 'text', text: 'first' }] },
        { kind: 'list-item', marker: '2.', depth: 0, spans: [{ kind: 'text', text: 'second' }] },
      ]);
    });

    it('VALID: {indented item} => records nesting as depth', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '- top\n  - nested' });

      expect(result).toStrictEqual([
        { kind: 'list-item', marker: '•', depth: 0, spans: [{ kind: 'text', text: 'top' }] },
        { kind: 'list-item', marker: '•', depth: 1, spans: [{ kind: 'text', text: 'nested' }] },
      ]);
    });

    it('EDGE: {item indented past the clamp} => depth stops at the maximum', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '            - deep' });

      expect(result).toStrictEqual([
        { kind: 'list-item', marker: '•', depth: 3, spans: [{ kind: 'text', text: 'deep' }] },
      ]);
    });

    it('VALID: {item with inline code} => parses the item spans', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '- calls `nav`' });

      expect(result).toStrictEqual([
        {
          kind: 'list-item',
          marker: '•',
          depth: 0,
          spans: [
            { kind: 'text', text: 'calls ' },
            { kind: 'code', text: 'nav' },
          ],
        },
      ]);
    });
  });

  describe('code fences', () => {
    it('VALID: {fenced block with language} => returns its content verbatim', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({
        text: '```typescript\nconst x = 1;\n```',
      });

      expect(result).toStrictEqual([
        { kind: 'code-block', language: 'typescript', content: 'const x = 1;' },
      ]);
    });

    it('EDGE: {markdown syntax inside a fence} => passed through as code, not parsed', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({
        text: '```\n# not a heading\n- not a list\n```',
      });

      expect(result).toStrictEqual([
        { kind: 'code-block', language: '', content: '# not a heading\n- not a list' },
      ]);
    });

    it('EDGE: {unterminated fence} => still renders what arrived', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '```sh\nnpm run ward' });

      expect(result).toStrictEqual([
        { kind: 'code-block', language: 'sh', content: 'npm run ward' },
      ]);
    });

    it('EDGE: {prose then fence} => flushes the pending paragraph first', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: 'run this:\n```\nls\n```' });

      expect(result).toStrictEqual([
        { kind: 'paragraph', spans: [{ kind: 'text', text: 'run this:' }] },
        { kind: 'code-block', language: '', content: 'ls' },
      ]);
    });
  });

  describe('quotes and rules', () => {
    it('VALID: {blockquote} => returns a quote block', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: '> quoted line' });

      expect(result).toStrictEqual([
        { kind: 'quote', spans: [{ kind: 'text', text: 'quoted line' }] },
      ]);
    });

    it('VALID: {horizontal rule} => returns a rule block', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({ text: 'before\n---\nafter' });

      expect(result).toStrictEqual([
        { kind: 'paragraph', spans: [{ kind: 'text', text: 'before' }] },
        { kind: 'rule' },
        { kind: 'paragraph', spans: [{ kind: 'text', text: 'after' }] },
      ]);
    });
  });

  describe('full message', () => {
    it('VALID: {heading, prose, list and fence} => returns every block in source order', () => {
      parseMarkdownBlocksTransformerProxy();

      const result = parseMarkdownBlocksTransformer({
        text: '## Gate 5\n\nAll claims verified against the diff.\n\n- `nav` is shared\n\n```sh\nnpm run ward\n```',
      });

      expect(result).toStrictEqual([
        { kind: 'heading', level: 2, spans: [{ kind: 'text', text: 'Gate 5' }] },
        {
          kind: 'paragraph',
          spans: [{ kind: 'text', text: 'All claims verified against the diff.' }],
        },
        {
          kind: 'list-item',
          marker: '•',
          depth: 0,
          spans: [
            { kind: 'code', text: 'nav' },
            { kind: 'text', text: ' is shared' },
          ],
        },
        { kind: 'code-block', language: 'sh', content: 'npm run ward' },
      ]);
    });
  });
});
