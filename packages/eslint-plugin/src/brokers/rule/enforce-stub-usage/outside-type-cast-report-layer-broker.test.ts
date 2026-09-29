import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ImportDeclarationStub } from '#gateway/npm/typescript-eslint__utils/import-declaration/import-declaration.stub';
import { TSAsExpressionStub } from '#gateway/npm/typescript-eslint__utils/ts-as-expression/ts-as-expression.stub';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';
import { outsideTypeCastReportLayerBroker } from './outside-type-cast-report-layer-broker';
import { outsideTypeCastReportLayerBrokerProxy } from './outside-type-cast-report-layer-broker.proxy';

describe('outsideTypeCastReportLayerBroker', () => {
  describe('outside type cast', () => {
    it('INVALID: {object literal as TSESTree.CallExpression} => reports outsideTypeCast with the root name', () => {
      outsideTypeCastReportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = TSAsExpressionStub({
        code: "const n = { type: 'CallExpression' } as TSESTree.CallExpression;",
      });
      const imports = astGetImportsTransformer({
        node: ImportDeclarationStub({
          code: "import type { TSESTree } from '@typescript-eslint/utils';",
        }),
      });

      outsideTypeCastReportLayerBroker({ node, imports, context });

      expect(mockReport.mock.calls).toStrictEqual([
        [{ node, messageId: 'outsideTypeCast', data: { typeName: 'TSESTree' } }],
      ]);
    });

    it('INVALID: {object literal as Partial<ChildProcess>} => reports the type looked through Partial', () => {
      outsideTypeCastReportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = TSAsExpressionStub({ code: 'const c = { pid: 1 } as Partial<ChildProcess>;' });
      const imports = astGetImportsTransformer({
        node: ImportDeclarationStub({ code: "import type { ChildProcess } from 'child_process';" }),
      });

      outsideTypeCastReportLayerBroker({ node, imports, context });

      expect(mockReport.mock.calls).toStrictEqual([
        [{ node, messageId: 'outsideTypeCast', data: { typeName: 'ChildProcess' } }],
      ]);
    });
  });

  describe('left alone', () => {
    it('VALID: {object literal as never} => reports nothing', () => {
      outsideTypeCastReportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = TSAsExpressionStub({ code: 'const c = { report: jest.fn() } as never;' });
      const imports = astGetImportsTransformer({
        node: ImportDeclarationStub({
          code: "import { TSESLint } from '@typescript-eslint/utils';",
        }),
      });

      outsideTypeCastReportLayerBroker({ node, imports, context });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {object literal as a locally declared type} => reports nothing', () => {
      outsideTypeCastReportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = TSAsExpressionStub({ code: 'const c = { a: 1 } as LocalShape;' });
      const imports = astGetImportsTransformer({
        node: ImportDeclarationStub({
          code: "import { TSESLint } from '@typescript-eslint/utils';",
        }),
      });

      outsideTypeCastReportLayerBroker({ node, imports, context });

      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});
