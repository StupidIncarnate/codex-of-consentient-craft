import { isMarkdownContentGuard } from './is-markdown-content-guard';

describe('isMarkdownContentGuard', () => {
  describe('authored markdown', () => {
    it('VALID: {leading heading} => returns true', () => {
      expect(isMarkdownContentGuard({ content: '# Operator\n\nYou own ONE operation item.' })).toBe(
        true,
      );
    });

    it('VALID: {heading part-way down} => returns true', () => {
      expect(
        isMarkdownContentGuard({ content: 'Intro line.\n\n### Gate 5\n\nAll claims verified.' }),
      ).toBe(true);
    });

    it('VALID: {fenced block, no heading} => returns true', () => {
      expect(isMarkdownContentGuard({ content: 'Run this:\n```sh\nnpm run ward\n```' })).toBe(true);
    });
  });

  describe('raw program output', () => {
    it('VALID: {npm script echo lines} => returns false', () => {
      expect(
        isMarkdownContentGuard({
          content: '> @dungeonmaster/web@1.0.0 build\n> tsc\n\n> done in 4s',
        }),
      ).toBe(false);
    });

    it('VALID: {unified diff of a markdown file} => returns false', () => {
      expect(
        isMarkdownContentGuard({
          content:
            'diff --git a/README.md b/README.md\n--- a/README.md\n+++ b/README.md\n@@ -1,3 +1,3 @@\n # Title\n-old line\n+new line',
        }),
      ).toBe(false);
    });

    it('VALID: {dash-prefixed log lines} => returns false', () => {
      expect(
        isMarkdownContentGuard({ content: '- removed one\n- removed two\n- removed three' }),
      ).toBe(false);
    });

    it('VALID: {shebang script body} => returns false', () => {
      expect(
        isMarkdownContentGuard({ content: '#!/bin/bash\nset -euo pipefail\nnpm run build' }),
      ).toBe(false);
    });
  });

  describe('single-line content', () => {
    it('VALID: {one line that starts with a hash} => returns false', () => {
      expect(isMarkdownContentGuard({ content: '# Operator' })).toBe(false);
    });

    it('EMPTY: {content: ""} => returns false', () => {
      expect(isMarkdownContentGuard({ content: '' })).toBe(false);
    });

    it('EMPTY: {content omitted} => returns false', () => {
      expect(isMarkdownContentGuard({})).toBe(false);
    });
  });

  describe('near-miss markers', () => {
    it('EDGE: {hash with no trailing space} => returns false', () => {
      expect(isMarkdownContentGuard({ content: '#define MAX 10\n#define MIN 1' })).toBe(false);
    });

    it('EDGE: {hash with nothing after it} => returns false', () => {
      expect(isMarkdownContentGuard({ content: '# \nstill a log line' })).toBe(false);
    });

    it('EDGE: {seven hashes} => returns false', () => {
      expect(isMarkdownContentGuard({ content: '####### too deep\nnext line' })).toBe(false);
    });

    it('EDGE: {heading indented one column} => returns false', () => {
      expect(isMarkdownContentGuard({ content: 'context\n # Title\nmore context' })).toBe(false);
    });
  });
});
