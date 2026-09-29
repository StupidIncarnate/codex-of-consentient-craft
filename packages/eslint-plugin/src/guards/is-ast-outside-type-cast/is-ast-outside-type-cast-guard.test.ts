import { ImportDeclarationStub } from '#gateway/npm/typescript-eslint__utils/import-declaration/import-declaration.stub';
import { TSAsExpressionStub } from '#gateway/npm/typescript-eslint__utils/ts-as-expression/ts-as-expression.stub';
import { VariableDeclaratorStub } from '#gateway/npm/typescript-eslint__utils/variable-declarator/variable-declarator.stub';
import { astGetImportsTransformer } from '../../transformers/ast-get-imports/ast-get-imports-transformer';
import { isAstOutsideTypeCastGuard } from './is-ast-outside-type-cast-guard';

const importsOf = ({ code }: { code: string }): ReturnType<typeof astGetImportsTransformer> =>
  astGetImportsTransformer({ node: ImportDeclarationStub({ code }) });

describe('isAstOutsideTypeCastGuard', () => {
  describe('outside type casts', () => {
    it('VALID: {object literal as TSESTree.CallExpression, TSESTree from a package} => returns true', () => {
      const node = TSAsExpressionStub({
        code: "const n = { type: 'CallExpression' } as TSESTree.CallExpression;",
      });
      const imports = importsOf({
        code: "import type { TSESTree } from '@typescript-eslint/utils';",
      });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(true);
    });

    it('VALID: {object literal as unknown as ts.SourceFile} => returns true', () => {
      const node = TSAsExpressionStub({
        code: "const s = { fileName: 'x.ts' } as unknown as ts.SourceFile;",
      });
      const imports = importsOf({ code: "import * as ts from 'typescript';" });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(true);
    });

    it('VALID: {object literal as Partial<TSESLint.RuleContext<string, []>>} => returns true', () => {
      const node = TSAsExpressionStub({
        code: 'const c = { report: jest.fn() } as Partial<TSESLint.RuleContext<string, []>>;',
      });
      const imports = importsOf({
        code: "import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';",
      });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(true);
    });

    it('VALID: {object literal as a workspace package type} => returns true', () => {
      const node = TSAsExpressionStub({ code: 'const r = { success: true } as AddQuestResult;' });
      const imports = importsOf({
        code: "import type { AddQuestResult } from '@dungeonmaster/shared/contracts';",
      });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(true);
    });

    it('VALID: {angle-bracket assertion of an object literal} => returns true', () => {
      const { init } = VariableDeclaratorStub({ code: 'const n = <ChildProcess>{ pid: 1 };' });
      const imports = importsOf({ code: "import type { ChildProcess } from 'child_process';" });

      expect(isAstOutsideTypeCastGuard({ node: init, imports })).toBe(true);
    });
  });

  describe('left alone', () => {
    it('INVALID: {object literal as never} => returns false', () => {
      const node = TSAsExpressionStub({ code: 'const c = { report: jest.fn() } as never;' });
      const imports = importsOf({ code: "import { TSESLint } from '@typescript-eslint/utils';" });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(false);
    });

    it('INVALID: {object literal as const} => returns false', () => {
      const node = TSAsExpressionStub({ code: 'const c = { a: 1 } as const;' });
      const imports = importsOf({ code: "import { TSESLint } from '@typescript-eslint/utils';" });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(false);
    });

    it('INVALID: {object literal as a locally declared type} => returns false', () => {
      const node = TSAsExpressionStub({ code: 'const c = { a: 1 } as LocalShape;' });
      const imports = importsOf({ code: "import { TSESLint } from '@typescript-eslint/utils';" });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(false);
    });

    it('INVALID: {object literal as a type imported from a relative path} => returns false', () => {
      const node = TSAsExpressionStub({ code: 'const c = { a: 1 } as Shape;' });
      const imports = importsOf({ code: "import type { Shape } from './shape-contract';" });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(false);
    });

    it('INVALID: {call result as an outside type} => returns false', () => {
      const node = TSAsExpressionStub({
        code: 'const c = build() as TSESLint.RuleContext<string, []>;',
      });
      const imports = importsOf({
        code: "import type { TSESLint } from '@typescript-eslint/utils';",
      });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(false);
    });

    it('INVALID: {clone of stub spreads as an outside type} => returns false', () => {
      const node = TSAsExpressionStub({
        code: 'const c = { ...ChildProcessStub() } as ChildProcess;',
      });
      const imports = importsOf({ code: "import type { ChildProcess } from 'child_process';" });

      expect(isAstOutsideTypeCastGuard({ node, imports })).toBe(false);
    });

    it('INVALID: {inner as unknown link of a chain} => returns false', () => {
      const outer = TSAsExpressionStub({
        code: 'const s = { fileName: 1 } as unknown as ts.SourceFile;',
      });
      const imports = importsOf({ code: "import * as ts from 'typescript';" });

      expect(
        isAstOutsideTypeCastGuard({
          node: outer.expression,
          imports,
        }),
      ).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      const imports = importsOf({ code: "import * as ts from 'typescript';" });

      expect(isAstOutsideTypeCastGuard({ imports })).toBe(false);
    });

    it('EMPTY: {imports: undefined} => returns false', () => {
      const node = TSAsExpressionStub({ code: 'const c = { a: 1 } as ts.SourceFile;' });

      expect(isAstOutsideTypeCastGuard({ node })).toBe(false);
    });
  });
});
