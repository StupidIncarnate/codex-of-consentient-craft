import { ArrayEntryLineParseLayerResponder } from './array-entry-line-parse-layer-responder';
import { ArrayEntryLineParseLayerResponderProxy } from './array-entry-line-parse-layer-responder.proxy';

describe('ArrayEntryLineParseLayerResponder', () => {
  describe('multiple entries packed onto one line', () => {
    it('VALID: {"exclude": ["node_modules", "worktrees"]} => returns both entries, dropping the "exclude" key', () => {
      ArrayEntryLineParseLayerResponderProxy();
      const line = '  "exclude": ["node_modules", "worktrees"]';
      const nodeModulesStart = line.indexOf('"node_modules"');
      const worktreesStart = line.indexOf('"worktrees"');

      const result = ArrayEntryLineParseLayerResponder({ line });

      expect(result).toStrictEqual({
        entries: [
          {
            value: 'node_modules',
            start: nodeModulesStart,
            end: nodeModulesStart + '"node_modules"'.length,
            quoteChar: '"',
          },
          {
            value: 'worktrees',
            start: worktreesStart,
            end: worktreesStart + '"worktrees"'.length,
            quoteChar: '"',
          },
        ],
      });
    });
  });

  describe('one entry, tightly packed with no space after the comma', () => {
    it('VALID: {["node_modules","worktrees"]} => the separator between entries carries no space', () => {
      ArrayEntryLineParseLayerResponderProxy();
      const line = '["node_modules","worktrees"]';
      const worktreesStart = line.indexOf('"worktrees"');

      const result = ArrayEntryLineParseLayerResponder({ line });

      expect(result).toStrictEqual({
        entries: [
          { value: 'node_modules', start: 1, end: 1 + '"node_modules"'.length, quoteChar: '"' },
          {
            value: 'worktrees',
            start: worktreesStart,
            end: worktreesStart + '"worktrees"'.length,
            quoteChar: '"',
          },
        ],
      });
    });
  });

  describe('a single entry alone on its own line, with a trailing comma', () => {
    it('VALID: {"      \'worktrees/**\',"} => returns the one entry', () => {
      ArrayEntryLineParseLayerResponderProxy();
      const line = "      'worktrees/**',";

      const result = ArrayEntryLineParseLayerResponder({ line });

      expect(result).toStrictEqual({
        entries: [{ value: 'worktrees/**', start: 6, end: 20, quoteChar: "'" }],
      });
    });
  });

  describe('a single entry alone on its own line, as the last entry with no trailing comma', () => {
    it('VALID: {\'    "worktrees"\'} => returns the one entry', () => {
      ArrayEntryLineParseLayerResponderProxy();
      const line = '    "worktrees"';

      const result = ArrayEntryLineParseLayerResponder({ line });

      expect(result).toStrictEqual({
        entries: [{ value: 'worktrees', start: 4, end: 15, quoteChar: '"' }],
      });
    });
  });

  describe('a quoted value in comment position, not array-entry position', () => {
    it("EDGE: {// still exclude 'worktrees' via legacy config} => returns no entries", () => {
      ArrayEntryLineParseLayerResponderProxy();
      const line = "  // still exclude 'worktrees' via legacy config";

      const result = ArrayEntryLineParseLayerResponder({ line });

      expect(result).toStrictEqual({ entries: [] });
    });
  });

  describe('a quoted value in a trailing comment, after a real entry', () => {
    it("EDGE: {'worktrees/**', // see 'worktrees' notes} => returns only the real entry, not the commented one", () => {
      ArrayEntryLineParseLayerResponderProxy();
      const line = "      'worktrees/**', // see 'worktrees' notes";

      const result = ArrayEntryLineParseLayerResponder({ line });

      expect(result).toStrictEqual({
        entries: [{ value: 'worktrees/**', start: 6, end: 20, quoteChar: "'" }],
      });
    });
  });

  describe('a line whose quote never closes', () => {
    it("EDGE: {'unterminated-value-with-no-closing-quote} => returns no entries", () => {
      ArrayEntryLineParseLayerResponderProxy();
      const line = "      'unterminated-value-with-no-closing-quote";

      const result = ArrayEntryLineParseLayerResponder({ line });

      expect(result).toStrictEqual({ entries: [] });
    });
  });

  describe('no quotes at all', () => {
    it('EMPTY: {"  ignores: ["} => returns no entries', () => {
      ArrayEntryLineParseLayerResponderProxy();
      const line = '  ignores: [';

      const result = ArrayEntryLineParseLayerResponder({ line });

      expect(result).toStrictEqual({ entries: [] });
    });
  });
});
