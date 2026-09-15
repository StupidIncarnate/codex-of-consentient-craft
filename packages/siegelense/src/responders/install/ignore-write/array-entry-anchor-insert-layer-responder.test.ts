import { ArrayEntryAnchorInsertLayerResponder } from './array-entry-anchor-insert-layer-responder';
import { ArrayEntryAnchorInsertLayerResponderProxy } from './array-entry-anchor-insert-layer-responder.proxy';

const ANCHOR_VALUES = ['worktrees', 'worktrees/', 'worktrees/**'];
const ENTRY_VALUES = ['.siegelense', '.siegelense/', '.siegelense/**'];

const GLOB_ANCHOR_SHAPE_CASES = [
  ['worktrees', '.siegelense'],
  ['worktrees/', '.siegelense/'],
  ['worktrees/**', '.siegelense/**'],
] as const;

describe('ArrayEntryAnchorInsertLayerResponder', () => {
  describe('inserted entry shape follows the matched anchor shape', () => {
    it.each(GLOB_ANCHOR_SHAPE_CASES)(
      'VALID: {anchor: %s} => inserted entry takes the matching shape %s',
      (anchorShape, expectedEntryShape) => {
        ArrayEntryAnchorInsertLayerResponderProxy();
        const content = [
          'module.exports = [',
          '  {',
          '    ignores: [',
          "      'node_modules/**',",
          `      '${anchorShape}',`,
          "      'scripts/**',",
          '    ],',
          '  },',
          '];',
        ].join('\n');

        const result = ArrayEntryAnchorInsertLayerResponder({
          content,
          anchorValueCandidates: ANCHOR_VALUES,
          entryValueCandidates: ENTRY_VALUES,
        });

        expect(result).toStrictEqual({
          content: [
            'module.exports = [',
            '  {',
            '    ignores: [',
            "      'node_modules/**',",
            `      '${anchorShape}',`,
            `      '${expectedEntryShape}',`,
            "      'scripts/**',",
            '    ],',
            '  },',
            '];',
          ].join('\n'),
          inserted: true,
          alreadyPresent: false,
          matchedEntryValue: expectedEntryShape,
        });
      },
    );
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
        matchedEntryValue: '.siegelense',
      });
    });
  });

  describe('regex array: anchor wrapped in slashes, entry follows the same wrap', () => {
    it('VALID: {jest testPathIgnorePatterns anchor /worktrees/, not /.siegelense/} => inserted entry is wrapped the same way, the distinct third shape a glob array never takes', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const regexAnchorValues = ['worktrees', 'worktrees/', '/worktrees/'];
      const regexEntryValues = ['.siegelense', '.siegelense/', '/.siegelense/'];
      const content = [
        'module.exports = {',
        '  testPathIgnorePatterns: [',
        "    '/node_modules/',",
        "    '/worktrees/',",
        "    '/dist/',",
        '  ],',
        '};',
      ].join('\n');

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: regexAnchorValues,
        entryValueCandidates: regexEntryValues,
      });

      expect(result).toStrictEqual({
        content: [
          'module.exports = {',
          '  testPathIgnorePatterns: [',
          "    '/node_modules/',",
          "    '/worktrees/',",
          "    '/.siegelense/',",
          "    '/dist/',",
          '  ],',
          '};',
        ].join('\n'),
        inserted: true,
        alreadyPresent: false,
        matchedEntryValue: '/.siegelense/',
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
      });

      expect(result).toStrictEqual({
        content,
        inserted: false,
        alreadyPresent: true,
        matchedEntryValue: '.siegelense/**',
      });
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
      });

      expect(result).toStrictEqual({
        content,
        inserted: false,
        alreadyPresent: false,
        matchedEntryValue: undefined,
      });
    });
  });

  describe('single-line array: anchor packed inline with a sibling entry', () => {
    it('VALID: {tsconfig exclude packed on one line, anchor present, entry absent} => inserted inline, in the anchor quote character and shape', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = [
        '{',
        '  // scratch tsconfig',
        '  "compilerOptions": { "strict": true },',
        '  "exclude": ["node_modules", "worktrees"]',
        '}',
      ].join('\n');

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
      });

      expect(result).toStrictEqual({
        content: [
          '{',
          '  // scratch tsconfig',
          '  "compilerOptions": { "strict": true },',
          '  "exclude": ["node_modules", "worktrees", ".siegelense"]',
          '}',
        ].join('\n'),
        inserted: true,
        alreadyPresent: false,
        matchedEntryValue: '.siegelense',
      });
    });
  });

  describe('single-line array: anchor is the first entry, sibling follows', () => {
    it('VALID: {eslint ignores packed on one line, anchor first, entry absent} => inserted inline right after the anchor, before the next entry', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = "  ignores: ['worktrees/**', 'scripts/**'],";

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
      });

      expect(result).toStrictEqual({
        content: "  ignores: ['worktrees/**', '.siegelense/**', 'scripts/**'],",
        inserted: true,
        alreadyPresent: false,
        matchedEntryValue: '.siegelense/**',
      });
    });
  });

  describe('single-line array: anchor is the only entry', () => {
    it('EDGE: {"exclude": ["worktrees"]} => inserted inline with a default ", " separator, there being no sibling to copy one from', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = '  "exclude": ["worktrees"]';

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
      });

      expect(result).toStrictEqual({
        content: '  "exclude": ["worktrees", ".siegelense"]',
        inserted: true,
        alreadyPresent: false,
        matchedEntryValue: '.siegelense',
      });
    });
  });

  describe('single-line array: entry already present inline', () => {
    it('EDGE: {"exclude": ["worktrees", ".siegelense"]} => content returned unchanged, alreadyPresent true', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = '  "exclude": ["node_modules", "worktrees", ".siegelense"]';

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
      });

      expect(result).toStrictEqual({
        content,
        inserted: false,
        alreadyPresent: true,
        matchedEntryValue: '.siegelense',
      });
    });
  });

  describe('single-line array: idempotence across two runs', () => {
    it('VALID: {responder run twice against a single-line tsconfig exclude} => .siegelense appears exactly once, not twice', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = '  "exclude": ["node_modules", "worktrees"]';

      const firstResult = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
      });
      const secondResult = ArrayEntryAnchorInsertLayerResponder({
        content: firstResult.content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
      });

      expect(firstResult.content).toBe('  "exclude": ["node_modules", "worktrees", ".siegelense"]');
      expect(secondResult).toStrictEqual({
        content: firstResult.content,
        inserted: false,
        alreadyPresent: true,
        matchedEntryValue: '.siegelense',
      });
    });
  });

  describe('single-line array: a comment mentions the anchor word, in quotes, but is not an entry', () => {
    it("EDGE: {// still exclude 'worktrees' via legacy config, beside a real single-line array} => the comment is never read as an anchor, and the real array is untouched because it does not exclude worktrees", () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = [
        "  // still exclude 'worktrees' via legacy config",
        '  "exclude": ["node_modules", "dist"]',
      ].join('\n');

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
      });

      expect(result).toStrictEqual({
        content,
        inserted: false,
        alreadyPresent: false,
        matchedEntryValue: undefined,
      });
    });
  });

  describe('single-line array: a longer path contains the anchor word but is not equal to it', () => {
    it('EDGE: {"exclude": ["node_modules", "src/worktrees-helper.ts"]} => not read as the worktrees anchor, nothing inserted', () => {
      ArrayEntryAnchorInsertLayerResponderProxy();
      const content = '  "exclude": ["node_modules", "src/worktrees-helper.ts"]';

      const result = ArrayEntryAnchorInsertLayerResponder({
        content,
        anchorValueCandidates: ANCHOR_VALUES,
        entryValueCandidates: ENTRY_VALUES,
      });

      expect(result).toStrictEqual({
        content,
        inserted: false,
        alreadyPresent: false,
        matchedEntryValue: undefined,
      });
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
        matchedEntryValue: '.siegelense/**',
      });
    });
  });
});
