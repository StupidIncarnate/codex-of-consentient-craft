import { RuleContextStub } from './rule-context.stub';

describe('RuleContextStub', () => {
  describe('defaults', () => {
    it('VALID: {} => real filename, options and sourceCode text', () => {
      const context = RuleContextStub();

      expect({
        filename: context.filename,
        physicalFilename: context.physicalFilename,
        options: context.options,
        sourceText: context.sourceCode.getText(),
        cwd: context.cwd,
      }).toStrictEqual({
        filename: 'gateway-stub-sample.ts',
        physicalFilename: 'gateway-stub-sample.ts',
        options: [],
        sourceText: 'const a = 1;',
        cwd: process.cwd(),
      });
    });

    it('VALID: {} => report is a jest mock by default', () => {
      const context = RuleContextStub();

      expect(jest.isMockFunction(context.report)).toBe(true);
    });

    // Every RuleContext member is written, never a Partial — real ESLint (9.36, checked
    // 2026-09-27) no longer implements getAncestors/getScope/markVariableAsUsed/
    // getDeclaredVariables AS CONTEXT METHODS (their replacements moved onto sourceCode, tested
    // through sourceCode directly below), so `@typescript-eslint/no-deprecated` refuses any
    // expression that reads them off a value typed as RuleContext — this checks their PRESENCE
    // through Object.keys, which touches no property by name, rather than by invoking them.
    it('VALID: {} => every RuleContext member is present, not a Partial', () => {
      const context = RuleContextStub();

      expect(Object.keys(context).sort()).toStrictEqual([
        'cwd',
        'filename',
        'getAncestors',
        'getCwd',
        'getDeclaredVariables',
        'getFilename',
        'getPhysicalFilename',
        'getScope',
        'getSourceCode',
        'id',
        'languageOptions',
        'markVariableAsUsed',
        'options',
        'parserOptions',
        'parserPath',
        'physicalFilename',
        'report',
        'settings',
        'sourceCode',
      ]);
    });
  });

  describe('overrides', () => {
    it('VALID: {filename} => overrides the real captured filename', () => {
      const context = RuleContextStub({ filename: 'x.ts' });

      expect({
        filename: context.filename,
        physicalFilename: context.physicalFilename,
      }).toStrictEqual({
        filename: 'x.ts',
        physicalFilename: 'x.ts',
      });
    });

    it('VALID: {report} => a caller-supplied report replaces the default mock', () => {
      const customReport = jest.fn();
      const context = RuleContextStub({ report: customReport });

      context.report({ messageId: 'x', loc: { line: 1, column: 0 } });

      expect(customReport).toHaveBeenCalledTimes(1);
    });

    it('VALID: {code} => real sourceCode text reflects the given code', () => {
      const context = RuleContextStub({ code: 'let b = 2;' });

      expect(context.sourceCode.getText()).toBe('let b = 2;');
    });
  });

  describe('sourceCode — the real delegation target for the four retired context shortcuts', () => {
    it('VALID: {} => sourceCode.getScope(ast) returns the real global scope', () => {
      const context = RuleContextStub();

      expect(context.sourceCode.getScope(context.sourceCode.ast).type).toBe('global');
    });

    it('VALID: {} => sourceCode.getAncestors(ast) returns the real (empty) ancestor list', () => {
      const context = RuleContextStub();

      expect(context.sourceCode.getAncestors(context.sourceCode.ast)).toStrictEqual([]);
    });

    it('VALID: {} => sourceCode.markVariableAsUsed("a", ast) marks the real declared variable', () => {
      const context = RuleContextStub();

      expect(context.sourceCode.markVariableAsUsed('a', context.sourceCode.ast)).toBe(true);
    });

    it('VALID: {} => sourceCode.getDeclaredVariables(ast) on the root returns the real (empty) list', () => {
      const context = RuleContextStub();

      expect(context.sourceCode.getDeclaredVariables(context.sourceCode.ast)).toStrictEqual([]);
    });
  });
});
