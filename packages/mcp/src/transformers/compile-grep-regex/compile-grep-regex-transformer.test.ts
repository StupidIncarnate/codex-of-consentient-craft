import { compileGrepRegexTransformer } from './compile-grep-regex-transformer';
import { DiscoverInputStub } from '../../contracts/discover-input/discover-input.stub';

describe('compileGrepRegexTransformer', () => {
  describe('regex mode (default)', () => {
    it('VALID: {plain kebab identifier} => compiles as regex with same text (no metacharacters)', () => {
      const { grep } = DiscoverInputStub({ grep: 'fs-mkdir-adapter' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.toString()).toBe('/fs-mkdir-adapter/gmu');
    });

    it('VALID: {plain kebab identifier tested against matching string} => matches', () => {
      const { grep } = DiscoverInputStub({ grep: 'fs-mkdir-adapter' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('fs-mkdir-adapter')).toBe(true);
    });

    it('VALID: {pattern with dot} => dot acts as regex wildcard', () => {
      const { grep } = DiscoverInputStub({ grep: 'fs-mkdir-adapter.ts' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('fs-mkdir-adapterXts')).toBe(true);
    });

    it('VALID: {alternation pipe} => matches first alternative', () => {
      const { grep } = DiscoverInputStub({ grep: 'delete|remove' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('delete')).toBe(true);
    });

    it('VALID: {alternation pipe} => matches second alternative', () => {
      const { grep } = DiscoverInputStub({ grep: 'delete|remove' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('remove')).toBe(true);
    });

    it('VALID: {alternation pipe} => does not match unrelated string', () => {
      const { grep } = DiscoverInputStub({ grep: 'delete|remove' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('create')).toBe(false);
    });

    it('VALID: {dot-star wildcard} => matches any characters between parts', () => {
      const { grep } = DiscoverInputStub({ grep: 'import.*shared' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test("import { x } from '@dungeonmaster/shared'")).toBe(true);
    });

    it('VALID: {word-char class} => matches word characters', () => {
      const { grep } = DiscoverInputStub({ grep: 'export const \\w+Guard' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('export const isNewSessionGuard')).toBe(true);
    });

    it('VALID: {anchor caret} => matches line start in multiline mode', () => {
      const { grep } = DiscoverInputStub({ grep: '^export const' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('import foo;\nexport const bar')).toBe(true);
    });

    it('VALID: {digit class} => matches digits', () => {
      const { grep } = DiscoverInputStub({ grep: '\\d+' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('abc 123')).toBe(true);
    });
  });

  describe('regex mode via `re:` prefix', () => {
    it('VALID: {re: digit pattern} => compiles to active regex', () => {
      const { grep } = DiscoverInputStub({ grep: 're:\\d+' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.toString()).toBe('/\\d+/gmu');
    });

    it('VALID: {re: digit pattern tested against digits} => matches', () => {
      const { grep } = DiscoverInputStub({ grep: 're:\\d+' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('abc 123')).toBe(true);
    });

    it('VALID: {re: anchored empty line in multiline mode} => matches empty lines', () => {
      const { grep } = DiscoverInputStub({ grep: 're:^$' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect('a\n\nb'.match(result)).toStrictEqual(['']);
    });

    it('VALID: {re: with inline (?i) flag} => merges flags with required gmu (normalized by JS to alphabetical order)', () => {
      const { grep } = DiscoverInputStub({ grep: 're:(?i)error' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.toString()).toBe('/error/gimu');
    });

    it('VALID: {re: case-insensitive pattern tested against uppercase} => matches', () => {
      const { grep } = DiscoverInputStub({ grep: 're:(?i)error' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('ERROR found')).toBe(true);
    });

    it('VALID: {re: dotall pattern spanning lines} => matches across newlines', () => {
      const { grep } = DiscoverInputStub({ grep: 're:foo[\\s\\S]*?bar' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('foo\nmiddle\nbar')).toBe(true);
    });
  });

  describe('regex mode via inline flag syntax', () => {
    it('VALID: {(?i)error without re:} => treated as regex', () => {
      const { grep } = DiscoverInputStub({ grep: '(?i)error' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('ERROR')).toBe(true);
    });
  });

  describe('invalid regex fallback', () => {
    it('VALID: {unclosed group} => falls back to literal match', () => {
      const { grep } = DiscoverInputStub({ grep: 'broker.parse(input' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('broker.parse(input')).toBe(true);
    });

    it('VALID: {unclosed group} => literal fallback does not match wildcard', () => {
      const { grep } = DiscoverInputStub({ grep: 'broker.parse(input' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('brokerXparseXinput')).toBe(false);
    });

    it('VALID: {re: with unclosed bracket} => falls back to literal match', () => {
      const { grep } = DiscoverInputStub({ grep: 're:[invalid' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('has [invalid bracket')).toBe(true);
    });

    it('VALID: {alternation with invalid second branch} => falls back to literal', () => {
      const { grep } = DiscoverInputStub({ grep: 'foo|[invalid' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('foo|[invalid')).toBe(true);
    });
  });
});
