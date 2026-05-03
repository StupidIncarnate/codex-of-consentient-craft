import { widgetContextContract } from './widget-context-contract';
import { WidgetContextStub } from './widget-context.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';
import { WidgetTreeResultStub } from '../widget-tree-result/widget-tree-result.stub';

describe('widgetContextContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => parses with empty tree, edges, and default packageRoot', () => {
      const result = WidgetContextStub();

      expect(result).toStrictEqual({
        widgetTree: WidgetTreeResultStub(),
        httpEdges: [],
        wsEdges: [],
        packageRoot: '/repo/packages/web',
        projectRoot: '/repo',
      });
    });

    it('VALID: {custom packageRoot} => parses with override', () => {
      const result = WidgetContextStub({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/other' }),
      });

      expect(result).toStrictEqual({
        widgetTree: WidgetTreeResultStub(),
        httpEdges: [],
        wsEdges: [],
        packageRoot: '/repo/packages/other',
        projectRoot: '/repo',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing packageRoot} => throws ZodError', () => {
      expect(() =>
        widgetContextContract.parse({
          widgetTree: WidgetTreeResultStub(),
          httpEdges: [],
          wsEdges: [],
          projectRoot: '/repo',
        }),
      ).toThrow(/Required/u);
    });
  });
});
