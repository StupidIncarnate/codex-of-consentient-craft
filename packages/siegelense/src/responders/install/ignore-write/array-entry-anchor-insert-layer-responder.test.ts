import { ArrayEntryAnchorInsertLayerResponder } from './array-entry-anchor-insert-layer-responder';
import { ArrayEntryAnchorInsertLayerResponderProxy } from './array-entry-anchor-insert-layer-responder.proxy';

const ANCHOR_VALUES = ['worktrees', 'worktrees/', 'worktrees/**'];
const ENTRY_VALUES = ['.siegelense', '.siegelense/', '.siegelense/**'];

describe('ArrayEntryAnchorInsertLayerResponder', () => {
  describe('anchor present, entry absent, single-quoted with a trailing comma', () => {
    it('VALID: {anchor mid-array, single-quoted, trailing comma} => inserted right after it, same quote and comma style', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = [
        'module.exports = [',
        '  {',
        '    ignores: [',
        "      'node_modules/**',",
        "      'worktrees/**',",
        "      'scripts/**',",
        '    ],',
        '  },',
        '];',
      ].join('\n');

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
        newEntryValue: '.siegelense/**',
      });

      expect(result).toStrictEqual({
        content: [
          'module.exports = [',
          '  {',
          '    ignores: [',
          "      'node_modules/**',",
          "      'worktrees/**',",
          "      '.siegelense/**',",
          "      'scripts/**',",
          '    ],',
          '  },',
          '];',
        ].join('\n'),
        inserted: true,
        alreadyPresent: false,
      });
    });
  });

  describe('anchor present, entry absent, double-quoted as the LAST entry with no trailing comma', () => {
    it('EDGE: {anchor is the last array entry, no trailing comma} => anchor gains the comma it now needs, new entry carries none', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = [
        '{',
        '  "exclude": [',
        '    "node_modules",',
        '    "worktrees"',
        '  ]',
        '}',
      ].join('\n');

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
        newEntryValue: '.siegelense',
      });

      expect(result).toStrictEqual({
        content: [
          '{',
          '  "exclude": [',
          '    "node_modules",',
          '    "worktrees",',
          '    ".siegelense"',
          '  ]',
          '}',
        ].join('\n'),
        inserted: true,
        alreadyPresent: false,
      });
    });
  });

  describe('entry already present', () => {
    it('EDGE: {anchor present AND entry already present} => content returned unchanged, alreadyPresent true', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = [
        'module.exports = [',
        '  {',
        '    ignores: [',
        "      'worktrees/**',",
        "      '.siegelense/**',",
        '    ],',
        '  },',
        '];',
      ].join('\n');

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
        newEntryValue: '.siegelense/**',
      });

      expect(result).toStrictEqual({ content, inserted: false, alreadyPresent: true });
    });
  });

  describe('anchor absent', () => {
    it('EDGE: {no line carries a value from anchorValueCandidates} => content returned unchanged, nothing inserted', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = [
        'module.exports = [',
        '  {',
        '    ignores: [',
        "      'node_modules/**',",
        "      'scripts/**',",
        '    ],',
        '  },',
        '];',
      ].join('\n');

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
        newEntryValue: '.siegelense/**',
      });

      expect(result).toStrictEqual({ content, inserted: false, alreadyPresent: false });
    });
  });

  describe('a line whose quote never closes, beside a real anchor', () => {
    it('EDGE: {one line opens a quote and never closes it} => that line parses as no value and is ignored, the real anchor still matches', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = [
        'module.exports = [',
        '  {',
        '    ignores: [',
        "      'unterminated-value-with-no-closing-quote",
        "      'worktrees/**',",
        '    ],',
        '  },',
        '];',
      ].join('\n');

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
        newEntryValue: '.siegelense/**',
      });

      expect(result).toStrictEqual({
        content: [
          'module.exports = [',
          '  {',
          '    ignores: [',
          "      'unterminated-value-with-no-closing-quote",
          "      'worktrees/**',",
          "      '.siegelense/**',",
          '    ],',
          '  },',
          '];',
        ].join('\n'),
        inserted: true,
        alreadyPresent: false,
      });
    });
  });
});
