import { TSAsExpressionStub } from '#gateway/npm/typescript-eslint__utils/ts-as-expression/ts-as-expression.stub';
import { astCastTargetRootNameTransformer } from './ast-cast-target-root-name-transformer';

describe('astCastTargetRootNameTransformer', () => {
  describe('named targets', () => {
    it('VALID: {target: ChildProcess} => returns "ChildProcess"', () => {
      const { typeAnnotation } = TSAsExpressionStub({ code: 'a as ChildProcess;' });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe('ChildProcess');
    });

    it('VALID: {target: TSESLint.RuleContext<string, []>} => returns "TSESLint"', () => {
      const { typeAnnotation } = TSAsExpressionStub({
        code: 'a as TSESLint.RuleContext<string, []>;',
      });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe('TSESLint');
    });

    it('VALID: {target: ts.SourceFile} => returns "ts"', () => {
      const { typeAnnotation } = TSAsExpressionStub({ code: 'a as ts.SourceFile;' });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe('ts');
    });
  });

  describe('single-argument wrappers', () => {
    it('VALID: {target: Partial<TSESLint.RuleContext<string, []>>} => returns "TSESLint"', () => {
      const { typeAnnotation } = TSAsExpressionStub({
        code: 'a as Partial<TSESLint.RuleContext<string, []>>;',
      });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe('TSESLint');
    });

    it('VALID: {target: Readonly<Partial<Stats>>} => returns "Stats"', () => {
      const { typeAnnotation } = TSAsExpressionStub({ code: 'a as Readonly<Partial<Stats>>;' });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe('Stats');
    });
  });

  describe('no root name', () => {
    it('EMPTY: {target: never} => returns null', () => {
      const { typeAnnotation } = TSAsExpressionStub({ code: 'a as never;' });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe(null);
    });

    it('EMPTY: {target: const} => returns null', () => {
      const { typeAnnotation } = TSAsExpressionStub({ code: 'a as const;' });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe(null);
    });

    it('EMPTY: {target: unknown} => returns null', () => {
      const { typeAnnotation } = TSAsExpressionStub({ code: 'a as unknown;' });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe(null);
    });

    it('EMPTY: {target: string} => returns null', () => {
      const { typeAnnotation } = TSAsExpressionStub({ code: 'a as string;' });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe(null);
    });

    it('EMPTY: {target: Partial<string>} => returns null', () => {
      const { typeAnnotation } = TSAsExpressionStub({ code: 'a as Partial<string>;' });

      expect(astCastTargetRootNameTransformer({ node: typeAnnotation })).toBe(null);
    });

    it('EMPTY: {node: undefined} => returns null', () => {
      expect(astCastTargetRootNameTransformer({})).toBe(null);
    });
  });
});
