import { compileGrepRegexTransformer } from './compile-grep-regex-transformer';
import { DiscoverInputStub } from '../../contracts/discover-input/discover-input.stub';

describe('compileGrepRegexTransformer', () => {
  describe('literal mode (default)', () => {
    it('VALID: {plain kebab identifier} => literal regex, hyphens not escaped (not metacharacters)', () => {
      const { grep } = DiscoverInputStub({ grep: 'fs-mkdir-adapter' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.toString()).toBe('/fs-mkdir-adapter/gmu');
    });

    it('VALID: {literal pattern tested against matching string} => matches', () => {
      const { grep } = DiscoverInputStub({ grep: 'fs-mkdir-adapter' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('fs-mkdir-adapter')).toBe(true);
    });

    it('VALID: {literal pattern with dot tested against different separator} => does not match', () => {
      const { grep } = DiscoverInputStub({ grep: 'fs-mkdir-adapter.ts' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('fs-mkdir-adapterXts')).toBe(false);
    });

    it('VALID: {literal pattern with dot tested against literal} => matches', () => {
      const { grep } = DiscoverInputStub({ grep: 'fs-mkdir-adapter.ts' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('fs-mkdir-adapter.ts')).toBe(true);
    });

    it('VALID: {literal pattern with open paren} => escapes paren, still valid regex', () => {
      const { grep } = DiscoverInputStub({ grep: 'broker.parse(input' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('broker.parse(input')).toBe(true);
    });

    it('VALID: {backslash-d literal} => does not match digits', () => {
      const { grep } = DiscoverInputStub({ grep: '\\d+' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('123')).toBe(false);
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
    it('VALID: {re: with unclosed bracket} => falls back to literal match', () => {
      const { grep } = DiscoverInputStub({ grep: 're:[invalid' });

      const result = compileGrepRegexTransformer({ pattern: grep! });

      expect(result.test('has [invalid bracket')).toBe(true);
    });
  });
});
