import { contentGrepTransformer } from './content-grep-transformer';
import { FileContentsStub } from '@dungeonmaster/shared/contracts';
import { GrepHitStub } from '../../contracts/grep-hit/grep-hit.stub';
import { DiscoverInputStub } from '../../contracts/discover-input/discover-input.stub';

describe('contentGrepTransformer', () => {
  describe('literal mode (default)', () => {
    it('VALID: basic literal match => returns single hit', () => {
      const contents = FileContentsStub({ value: 'line one\nERROR here\nline three' });
      const { grep: pattern } = DiscoverInputStub({ grep: 'ERROR' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([GrepHitStub({ line: 2, text: 'ERROR here' })]);
    });

    it('VALID: no match => returns empty array', () => {
      const contents = FileContentsStub({ value: 'line one\nline two\nline three' });
      const { grep: pattern } = DiscoverInputStub({ grep: 'MISSING' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([]);
    });

    it('VALID: multiple matches => returns all hits', () => {
      const contents = FileContentsStub({ value: 'foo bar\nbaz foo\nqux\nfoo end' });
      const { grep: pattern } = DiscoverInputStub({ grep: 'foo' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([
        GrepHitStub({ line: 1, text: 'foo bar' }),
        GrepHitStub({ line: 2, text: 'baz foo' }),
        GrepHitStub({ line: 4, text: 'foo end' }),
      ]);
    });

    it('VALID: kebab identifier with dot => dot is literal, does not wildcard-match', () => {
      const contents = FileContentsStub({
        value: 'fs-mkdir-adapter.ts\nfs-mkdir-adapterXts\nother',
      });
      const { grep: pattern } = DiscoverInputStub({ grep: 'fs-mkdir-adapter.ts' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([GrepHitStub({ line: 1, text: 'fs-mkdir-adapter.ts' })]);
    });

    it('VALID: pattern with parens => escaped, matches literal .parse(', () => {
      const contents = FileContentsStub({
        value: 'const x = contract.parse(input);\nconst y = 42;',
      });
      const { grep: pattern } = DiscoverInputStub({ grep: '.parse(' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([
        GrepHitStub({ line: 1, text: 'const x = contract.parse(input);' }),
      ]);
    });

    it('VALID: backslash-d literal => does not match digits', () => {
      const contents = FileContentsStub({ value: 'abc 123\ndef 456\nghi' });
      const { grep: pattern } = DiscoverInputStub({ grep: '\\d+' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([]);
    });

    it('VALID: unclosed bracket literal => matches escaped bracket', () => {
      const contents = FileContentsStub({ value: 'has [invalid bracket\nno match here' });
      const { grep: pattern } = DiscoverInputStub({ grep: '[invalid' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([GrepHitStub({ line: 1, text: 'has [invalid bracket' })]);
    });
  });

  describe('regex mode via `re:` prefix', () => {
    it('VALID: re: digit pattern => matches digits', () => {
      const contents = FileContentsStub({ value: 'abc 123\ndef 456\nghi' });
      const { grep: pattern } = DiscoverInputStub({ grep: 're:\\d+' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([
        GrepHitStub({ line: 1, text: 'abc 123' }),
        GrepHitStub({ line: 2, text: 'def 456' }),
      ]);
    });

    it('VALID: re: anchored empty line => matches empty line in multiline mode', () => {
      const contents = FileContentsStub({ value: 'a\n\nb' });
      const { grep: pattern } = DiscoverInputStub({ grep: 're:^$' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([GrepHitStub({ line: 2, text: '' })]);
    });

    it('VALID: re: multi-line pattern with [\\s\\S] => matches across newlines', () => {
      const contents = FileContentsStub({
        value: 'noise\nfoo\nmiddle\nbar\nlater',
      });
      const { grep: pattern } = DiscoverInputStub({ grep: 're:foo[\\s\\S]*?bar' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([GrepHitStub({ line: 2, text: 'foo' })]);
    });

    it('VALID: re: function signature split across lines => matches at start line', () => {
      const contents = FileContentsStub({
        value: 'header\nexport const foo = ({\n  bar,\n}: { bar: string }): void => {',
      });
      const { grep: pattern } = DiscoverInputStub({
        grep: 're:export const foo[\\s\\S]*?: void',
      });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([GrepHitStub({ line: 2, text: 'export const foo = ({' })]);
    });
  });

  describe('inline flag syntax (backward compatible regex opt-in)', () => {
    it('VALID: (?i) case-insensitive => matches regardless of case', () => {
      const contents = FileContentsStub({ value: 'Error found\nno match\nERROR again' });
      const { grep: pattern } = DiscoverInputStub({ grep: '(?i)error' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([
        GrepHitStub({ line: 1, text: 'Error found' }),
        GrepHitStub({ line: 3, text: 'ERROR again' }),
      ]);
    });
  });

  describe('context expansion', () => {
    it('VALID: context 2 => includes surrounding lines', () => {
      const contents = FileContentsStub({ value: 'a\nb\nc\nMATCH\ne\nf\ng' });
      const { grep: pattern, context } = DiscoverInputStub({ grep: 'MATCH', context: 2 });

      const result = contentGrepTransformer({ contents, pattern: pattern!, context: context! });

      expect(result).toStrictEqual([
        GrepHitStub({ line: 2, text: 'b' }),
        GrepHitStub({ line: 3, text: 'c' }),
        GrepHitStub({ line: 4, text: 'MATCH' }),
        GrepHitStub({ line: 5, text: 'e' }),
        GrepHitStub({ line: 6, text: 'f' }),
      ]);
    });

    it('VALID: overlapping context => deduplicates lines', () => {
      const contents = FileContentsStub({ value: 'a\nMATCH1\nc\nMATCH2\ne' });
      const { grep: pattern, context } = DiscoverInputStub({ grep: 'MATCH', context: 1 });

      const result = contentGrepTransformer({ contents, pattern: pattern!, context: context! });

      expect(result).toStrictEqual([
        GrepHitStub({ line: 1, text: 'a' }),
        GrepHitStub({ line: 2, text: 'MATCH1' }),
        GrepHitStub({ line: 3, text: 'c' }),
        GrepHitStub({ line: 4, text: 'MATCH2' }),
        GrepHitStub({ line: 5, text: 'e' }),
      ]);
    });

    it('VALID: context at file boundary => clamps to valid range', () => {
      const contents = FileContentsStub({ value: 'MATCH\nb\nc' });
      const { grep: pattern, context } = DiscoverInputStub({ grep: 'MATCH', context: 3 });

      const result = contentGrepTransformer({ contents, pattern: pattern!, context: context! });

      expect(result).toStrictEqual([
        GrepHitStub({ line: 1, text: 'MATCH' }),
        GrepHitStub({ line: 2, text: 'b' }),
        GrepHitStub({ line: 3, text: 'c' }),
      ]);
    });

    it('VALID: context 0 => returns only matched lines', () => {
      const contents = FileContentsStub({ value: 'a\nMATCH\nc' });
      const { grep: pattern, context } = DiscoverInputStub({ grep: 'MATCH', context: 0 });

      const result = contentGrepTransformer({ contents, pattern: pattern!, context: context! });

      expect(result).toStrictEqual([GrepHitStub({ line: 2, text: 'MATCH' })]);
    });
  });

  describe('edge cases', () => {
    it('VALID: empty contents => returns empty array', () => {
      const contents = FileContentsStub({ value: '' });
      const { grep: pattern } = DiscoverInputStub({ grep: 'anything' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: match at last line with context exceeding file end => clamps', () => {
      const contents = FileContentsStub({ value: 'a\nb\nMATCH' });
      const { grep: pattern, context } = DiscoverInputStub({ grep: 'MATCH', context: 5 });

      const result = contentGrepTransformer({ contents, pattern: pattern!, context: context! });

      expect(result).toStrictEqual([
        GrepHitStub({ line: 1, text: 'a' }),
        GrepHitStub({ line: 2, text: 'b' }),
        GrepHitStub({ line: 3, text: 'MATCH' }),
      ]);
    });

    it('EDGE: context undefined with matches => returns only matched lines', () => {
      const contents = FileContentsStub({ value: 'a\nMATCH\nc' });
      const { grep: pattern } = DiscoverInputStub({ grep: 'MATCH' });

      const result = contentGrepTransformer({ contents, pattern: pattern! });

      expect(result).toStrictEqual([GrepHitStub({ line: 2, text: 'MATCH' })]);
    });
  });
});
