import { contentGrepTransformer } from './content-grep-transformer';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';
import { GrepHitStub } from '../../contracts/grep-hit/grep-hit.stub';
import { DiscoverInputStub } from '../../contracts/discover-input/discover-input.stub';

describe('contentGrepTransformer', () => {
  it('VALID: basic match => returns single hit', () => {
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

  it('VALID: regex pattern => matches with regex', () => {
    const contents = FileContentsStub({ value: 'abc 123\ndef 456\nghi' });
    const { grep: pattern } = DiscoverInputStub({ grep: '\\d+' });

    const result = contentGrepTransformer({ contents, pattern: pattern! });

    expect(result).toStrictEqual([
      GrepHitStub({ line: 1, text: 'abc 123' }),
      GrepHitStub({ line: 2, text: 'def 456' }),
    ]);
  });

  it('VALID: invalid regex => falls back to literal string match', () => {
    const contents = FileContentsStub({ value: 'has [invalid bracket\nno match here' });
    const { grep: pattern } = DiscoverInputStub({ grep: '[invalid' });

    const result = contentGrepTransformer({ contents, pattern: pattern! });

    expect(result).toStrictEqual([GrepHitStub({ line: 1, text: 'has [invalid bracket' })]);
  });

  it('VALID: unescaped parens => falls back to literal match for .parse()', () => {
    const contents = FileContentsStub({
      value: 'const x = contract.parse(input);\nconst y = 42;',
    });
    const { grep: pattern } = DiscoverInputStub({ grep: '.parse(' });

    const result = contentGrepTransformer({ contents, pattern: pattern! });

    expect(result).toStrictEqual([
      GrepHitStub({ line: 1, text: 'const x = contract.parse(input);' }),
    ]);
  });

  it('VALID: context lines => includes surrounding lines', () => {
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

  it('VALID: case-insensitive with (?i) flag => matches regardless of case', () => {
    const contents = FileContentsStub({ value: 'Error found\nno match\nERROR again' });
    const { grep: pattern } = DiscoverInputStub({ grep: '(?i)error' });

    const result = contentGrepTransformer({ contents, pattern: pattern! });

    expect(result).toStrictEqual([
      GrepHitStub({ line: 1, text: 'Error found' }),
      GrepHitStub({ line: 3, text: 'ERROR again' }),
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

  it('VALID: empty contents => returns empty array', () => {
    const contents = FileContentsStub({ value: '' });
    const { grep: pattern } = DiscoverInputStub({ grep: 'anything' });

    const result = contentGrepTransformer({ contents, pattern: pattern! });

    expect(result).toStrictEqual([]);
  });

  it('VALID: multiline flag (?s) in pattern => matches across behavior', () => {
    const contents = FileContentsStub({ value: 'start here\nend there' });
    const { grep: pattern } = DiscoverInputStub({ grep: '(?s)start' });

    const result = contentGrepTransformer({ contents, pattern: pattern! });

    expect(result).toStrictEqual([GrepHitStub({ line: 1, text: 'start here' })]);
  });

  it('EDGE: match at last line with context exceeding file end => clamps to valid range', () => {
    const contents = FileContentsStub({ value: 'a\nb\nMATCH' });
    const { grep: pattern, context } = DiscoverInputStub({ grep: 'MATCH', context: 5 });

    const result = contentGrepTransformer({ contents, pattern: pattern!, context: context! });

    expect(result).toStrictEqual([
      GrepHitStub({ line: 1, text: 'a' }),
      GrepHitStub({ line: 2, text: 'b' }),
      GrepHitStub({ line: 3, text: 'MATCH' }),
    ]);
  });

  it('EDGE: pattern matches empty line in contents => returns hit for empty line', () => {
    const contents = FileContentsStub({ value: 'a\n\nb' });
    const { grep: pattern } = DiscoverInputStub({ grep: '^$' });

    const result = contentGrepTransformer({ contents, pattern: pattern! });

    expect(result).toStrictEqual([GrepHitStub({ line: 2, text: '' })]);
  });

  it('EDGE: context undefined with matches => returns only matched lines', () => {
    const contents = FileContentsStub({ value: 'a\nMATCH\nc' });
    const { grep: pattern } = DiscoverInputStub({ grep: 'MATCH' });

    const result = contentGrepTransformer({ contents, pattern: pattern! });

    expect(result).toStrictEqual([GrepHitStub({ line: 2, text: 'MATCH' })]);
  });
});
