import { parseMarkdownSpansTransformer } from './parse-markdown-spans-transformer';
import { parseMarkdownSpansTransformerProxy } from './parse-markdown-spans-transformer.proxy';

describe('parseMarkdownSpansTransformer', () => {
  describe('plain text', () => {
    it('VALID: {text with no marks} => returns a single text span', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: 'Gate 4 complete.' });

      expect(result).toStrictEqual([{ kind: 'text', text: 'Gate 4 complete.' }]);
    });

    it('EMPTY: {text: ""} => returns no spans', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: '' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('inline code', () => {
    it('VALID: {backticked identifier} => splits text around a code span', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: 'both import `navigationHarness` now' });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'both import ' },
        { kind: 'code', text: 'navigationHarness' },
        { kind: 'text', text: ' now' },
      ]);
    });

    it('EDGE: {code containing asterisks} => code wins over the bold mark inside it', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: 'glob `**/*.ts` matched' });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'glob ' },
        { kind: 'code', text: '**/*.ts' },
        { kind: 'text', text: ' matched' },
      ]);
    });

    it('EDGE: {code at the very start and end} => emits no empty text spans', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: '`a` and `b`' });

      expect(result).toStrictEqual([
        { kind: 'code', text: 'a' },
        { kind: 'text', text: ' and ' },
        { kind: 'code', text: 'b' },
      ]);
    });
  });

  describe('bold and italic', () => {
    it('VALID: {double asterisks} => returns a bold span', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: 'this is **important** work' });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'this is ' },
        { kind: 'bold', text: 'important' },
        { kind: 'text', text: ' work' },
      ]);
    });

    it('VALID: {double underscores} => returns a bold span', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: '__loud__' });

      expect(result).toStrictEqual([{ kind: 'bold', text: 'loud' }]);
    });

    it('VALID: {single asterisks} => returns an italic span', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: 'read *carefully*' });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'read ' },
        { kind: 'italic', text: 'carefully' },
      ]);
    });

    it('VALID: {single underscores between spaces} => returns an italic span', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: 'read _carefully_ now' });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'read ' },
        { kind: 'italic', text: 'carefully' },
        { kind: 'text', text: ' now' },
      ]);
    });

    it('EDGE: {snake_case identifier} => left as plain text, not italicised', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: 'the tool_use_id field' });

      expect(result).toStrictEqual([{ kind: 'text', text: 'the tool_use_id field' }]);
    });

    it('EDGE: {bold before italic} => the double mark is preferred over two single ones', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: '**both** and *one*' });

      expect(result).toStrictEqual([
        { kind: 'bold', text: 'both' },
        { kind: 'text', text: ' and ' },
        { kind: 'italic', text: 'one' },
      ]);
    });

    it('EDGE: {unpaired asterisk} => left as plain text', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: '2 * 3 = 6' });

      expect(result).toStrictEqual([{ kind: 'text', text: '2 * 3 = 6' }]);
    });
  });

  describe('links', () => {
    it('VALID: {markdown link} => returns a link span carrying its href', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({
        text: 'see [the docs](https://x.dev/a) here',
      });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'see ' },
        { kind: 'link', text: 'the docs', href: 'https://x.dev/a' },
        { kind: 'text', text: ' here' },
      ]);
    });

    it('EDGE: {bracketed text with no target} => left as plain text', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({ text: 'the [pending] state' });

      expect(result).toStrictEqual([{ kind: 'text', text: 'the [pending] state' }]);
    });
  });

  describe('mixed marks', () => {
    it('VALID: {code, bold and a link in one line} => returns them in source order', () => {
      parseMarkdownSpansTransformerProxy();

      const result = parseMarkdownSpansTransformer({
        text: '`nav` is **shared** — see [why](https://x.dev)',
      });

      expect(result).toStrictEqual([
        { kind: 'code', text: 'nav' },
        { kind: 'text', text: ' is ' },
        { kind: 'bold', text: 'shared' },
        { kind: 'text', text: ' — see ' },
        { kind: 'link', text: 'why', href: 'https://x.dev' },
      ]);
    });
  });
});
