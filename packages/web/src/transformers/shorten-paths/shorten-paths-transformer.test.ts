import { shortenPathsTransformer } from './shorten-paths-transformer';
import { shortenPathsTransformerProxy } from './shorten-paths-transformer.proxy';

describe('shortenPathsTransformer', () => {
  describe('monorepo paths', () => {
    it('VALID: {packages path} => keeps the package name and the file name', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({
        text: 'packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
      });

      expect(result).toBe('web/…/use-quest-chat-binding.ts');
    });

    it('VALID: {absolute path through packages} => anchors on the package, not the filesystem root', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({
        text: '/home/dev/codex/packages/shared/src/contracts/chat-entry/chat-entry-contract.ts',
      });

      expect(result).toBe('shared/…/chat-entry-contract.ts');
    });

    it('EDGE: {packages path with one directory between} => elides that single directory', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: 'packages/web/src/index.ts' });

      expect(result).toBe('web/…/index.ts');
    });

    it('EDGE: {packages/web/index.ts} => stays whole below the elision budget', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: 'packages/web/index.ts' });

      expect(result).toBe('packages/web/index.ts');
    });
  });

  describe('non-package paths', () => {
    it('VALID: {absolute path outside packages} => anchors on the first segment and keeps the slash', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: '/tmp/claude/session/scratchpad' });

      expect(result).toBe('/tmp/…/scratchpad');
    });

    it('VALID: {relative path outside packages} => anchors on the first segment', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: 'scrolls/design/app/main.tsx' });

      expect(result).toBe('scrolls/…/main.tsx');
    });

    it('EDGE: {three-segment path} => left untouched', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: 'scrolls/design/foo.md' });

      expect(result).toBe('scrolls/design/foo.md');
    });

    it('EDGE: {two-segment absolute path} => left untouched', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: '/src/index.ts' });

      expect(result).toBe('/src/index.ts');
    });
  });

  describe('globs', () => {
    it('VALID: {glob ending in **} => keeps the globbed directory alongside the wildcard', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: 'packages/web/src/widgets/app/**' });

      expect(result).toBe('web/…/app/**');
    });

    it('VALID: {brace-expansion glob} => keeps the brace segment as the globbed directory', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({
        text: 'packages/web/test/harnesses/{comment-box,persisted-comments}/**',
      });

      expect(result).toBe('web/…/{comment-box,persisted-comments}/**');
    });

    it('EDGE: {packages/web/**} => stays whole below the elision budget', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: 'packages/web/**' });

      expect(result).toBe('packages/web/**');
    });

    it('EDGE: {glob whose wildcard directly follows the anchor} => drops the packages prefix without eliding', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: 'packages/web/src/**' });

      expect(result).toBe('web/src/**');
    });
  });

  describe('mixed text', () => {
    it('VALID: {command with several paths} => shortens each and preserves the spacing', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({
        text: 'git diff -- packages/web/src/guards/a/a-guard.ts packages/shared/src/guards/b/b-guard.ts',
      });

      expect(result).toBe('git diff -- web/…/a-guard.ts shared/…/b-guard.ts');
    });

    it('VALID: {key/value summary} => shortens only the path value', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({
        text: 'pattern: TODO, path: packages/web/src/widgets/tool-row/tool-row-widget.tsx',
      });

      expect(result).toBe('pattern: TODO, path: web/…/tool-row-widget.tsx');
    });

    it('EDGE: {url} => left untouched so the host stays readable', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: 'https://example.com/a/b/c/d' });

      expect(result).toBe('https://example.com/a/b/c/d');
    });

    it('EDGE: {git revision range} => left untouched when it carries no separator', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: '1c72e4f5..HEAD --name-status' });

      expect(result).toBe('1c72e4f5..HEAD --name-status');
    });

    it('EMPTY: {text: ""} => returns empty text', () => {
      shortenPathsTransformerProxy();

      const result = shortenPathsTransformer({ text: '' });

      expect(result).toBe('');
    });
  });
});
