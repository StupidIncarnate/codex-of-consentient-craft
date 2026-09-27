/**
 * PURPOSE: A complete, real `TSESLint.RuleContext` — captured from an actual `TSESLint.Linter` run
 * against real parsed code, never a hand-assembled partial. Real ESLint (9.36, checked 2026-09-27)
 * no longer implements the context-level `getAncestors`/`getScope`/`markVariableAsUsed`/
 * `getDeclaredVariables` methods the type still declares (their replacements moved onto
 * `sourceCode`, which DOES still implement all four, each now taking the target node explicitly) —
 * so those four delegate to the real `sourceCode`'s own methods against its root `Program` node,
 * rather than faking a return value the type would otherwise force a cast for. Nearly every real
 * caller overrides only `report`, so that is the one field built as a jest mock by default.
 *
 * USAGE:
 * const context = RuleContextStub({ filename: 'x.ts' });
 * context.report({ messageId: 'x', node: someNode });
 * // report is a jest mock by default — assert with `context.report` directly
 */
import { TSESLint } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';
import * as tsParser from '@typescript-eslint/parser';

const CAPTURE_PLUGIN_NAME = 'gateway-rule-context-stub';
const CAPTURE_RULE_NAME = 'capture';
const DEFAULT_CODE = 'const a = 1;';
const DEFAULT_FILENAME = 'gateway-stub-sample.ts';

const captureRealRuleContext = ({
  code,
  filename,
}: {
  code: string;
  filename: string;
}): TSESLint.RuleContext<string, unknown[]> => {
  const linter = new TSESLint.Linter({ configType: 'flat' });
  const capturedContexts: TSESLint.RuleContext<string, unknown[]>[] = [];

  linter.verify(
    code,
    [
      {
        files: ['**'],
        languageOptions: { parser: tsParser, sourceType: 'module' },
        plugins: {
          [CAPTURE_PLUGIN_NAME]: {
            rules: {
              [CAPTURE_RULE_NAME]: {
                meta: { schema: [] },
                create: (context: TSESLint.RuleContext<string, unknown[]>) => {
                  capturedContexts.push(context);
                  return {};
                },
              },
            },
          },
        },
        rules: { [`${CAPTURE_PLUGIN_NAME}/${CAPTURE_RULE_NAME}`]: 'error' },
      },
    ],
    filename,
  );

  const [captured] = capturedContexts;

  if (captured === undefined) {
    throw new Error(
      `RuleContextStub: ESLint never ran the capture rule against "${filename}" for code: ${code}`,
    );
  }

  return captured;
};

export const RuleContextStub = ({
  code = DEFAULT_CODE,
  filename = DEFAULT_FILENAME,
  report,
}: {
  code?: string;
  filename?: string;
  report?: TSESLint.RuleContext<string, unknown[]>['report'];
} = {}): TSESLint.RuleContext<string, unknown[]> => {
  const real = captureRealRuleContext({ code, filename });
  const { sourceCode } = real;
  const rootNode: TSESTree.Node = sourceCode.ast;

  return {
    id: real.id,
    languageOptions: real.languageOptions,
    options: real.options,
    parserOptions: real.parserOptions,
    parserPath: real.parserPath,
    settings: real.settings,
    cwd: real.cwd,
    filename: real.filename,
    physicalFilename: real.physicalFilename,
    sourceCode: real.sourceCode,
    getCwd: (): string => real.cwd,
    getFilename: (): string => real.filename,
    getPhysicalFilename: (): string => real.physicalFilename,
    getSourceCode: (): Readonly<TSESLint.SourceCode> => real.sourceCode,
    getAncestors: (): TSESTree.Node[] => sourceCode.getAncestors(rootNode),
    getScope: (): TSESLint.Scope.Scope => sourceCode.getScope(rootNode),
    getDeclaredVariables: (node: TSESTree.Node): readonly TSESLint.Scope.Variable[] =>
      sourceCode.getDeclaredVariables(node),
    markVariableAsUsed: (name: string): boolean => sourceCode.markVariableAsUsed(name, rootNode),
    report: report ?? jest.fn(),
  };
};
