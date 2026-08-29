import { elideMiddleTransformer } from './elide-middle-transformer';
import { elideMiddleTransformerProxy } from './elide-middle-transformer.proxy';

describe('elideMiddleTransformer', () => {
  describe('paths', () => {
    it('VALID: {absolute path over budget} => keeps the filename and drops the deepest directories', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({
        text: '/home/me/projects/app/src/deep/file.ts',
        limit: 30,
      });

      expect(result).toBe('/home/me/projects/…/file.ts');
    });

    // The failure this exists to prevent: a tail cut leaves the run of directories the reader
    // could already guess and drops the only part that identifies the file.
    it('VALID: {worktree round document} => the filename survives where a tail cut would drop it', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({
        text: '/home/brutus-home/projects/codex-of-consentient-craft/worktrees/server-health-badge-in-the-app-top-bar-try-2-a7520e60/.quest-plans/bde72c7a-6c21-4986-a91e-c8d154c0c8cc-round-1.md',
        limit: 120,
      });

      expect(result).toBe(
        '/home/brutus-home/projects/codex-of-consentient-craft/worktrees/…/bde72c7a-6c21-4986-a91e-c8d154c0c8cc-round-1.md',
      );
    });

    it('VALID: {relative path over budget} => anchors on the first segment', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({
        text: 'packages/web/src/widgets/tool-row/tool-row-widget.tsx',
        limit: 40,
      });

      expect(result).toBe('packages/web/src/…/tool-row-widget.tsx');
    });

    it('VALID: {path over budget} => the result fits the budget', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({
        text: '/home/me/projects/app/src/deep/nested/further/file.ts',
        limit: 30,
      });

      expect(result.length).toBeLessThanOrEqual(30);
    });

    it('EDGE: {path within budget} => left untouched', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({ text: '/src/index.ts', limit: 120 });

      expect(result).toBe('/src/index.ts');
    });

    // A head that skips a segment and takes a later one would read as a real path to a directory
    // that does not exist, and nothing on screen would say otherwise.
    it('EDGE: {one head segment too wide to fit} => stops there rather than taking a later one', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({
        text: 'a/b/an-extremely-long-directory-name-that-will-not-fit/c/file.ts',
        limit: 30,
      });

      expect(result).toBe('a/b/…/file.ts');
    });
  });

  describe('values with no path structure', () => {
    it('VALID: {long value with no separator} => cuts the middle at the character level', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({
        text: `${'a'.repeat(20)}${'z'.repeat(20)}`,
        limit: 11,
      });

      expect(result).toBe('aaaaa…zzzzz');
    });

    it('EDGE: {tail wider than the whole budget} => falls back to a character cut', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({ text: `/x/${'y'.repeat(40)}`, limit: 11 });

      expect(result).toBe('/x/yy…yyyyy');
    });

    it('EDGE: {value within budget} => left untouched', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({ text: 'TODO', limit: 120 });

      expect(result).toBe('TODO');
    });

    it('EMPTY: {text: ""} => returns empty text', () => {
      elideMiddleTransformerProxy();

      const result = elideMiddleTransformer({ text: '', limit: 120 });

      expect(result).toBe('');
    });
  });
});
