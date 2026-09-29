import { isPageCallbackCallLayerBroker } from './is-page-callback-call-layer-broker';
import { isPageCallbackCallLayerBrokerProxy } from './is-page-callback-call-layer-broker.proxy';
import { pageCallbackMethodsStatics } from '../../../statics/page-callback-methods/page-callback-methods-statics';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('isPageCallbackCallLayerBroker', () => {
  describe('browser-side method calls', () => {
    it.each(pageCallbackMethodsStatics.names)(
      'VALID: {page.%s(fn)} => returns true',
      (methodName) => {
        isPageCallbackCallLayerBrokerProxy();
        const node = TsestreeStub({
          type: TsestreeNodeType.CallExpression,
          callee: TsestreeStub({
            type: TsestreeNodeType.MemberExpression,
            computed: false,
            object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'page' }),
            property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: methodName }),
          }),
        });

        const result = isPageCallbackCallLayerBroker({ node });

        expect(result).toBe(true);
      },
    );
  });

  describe('other calls', () => {
    it('INVALID: {page.click()} => returns false', () => {
      isPageCallbackCallLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          computed: false,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'page' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'click' }),
        }),
      });

      const result = isPageCallbackCallLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {page[evaluate](fn), computed} => returns false', () => {
      isPageCallbackCallLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({
          type: TsestreeNodeType.MemberExpression,
          computed: true,
          object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'page' }),
          property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'evaluate' }),
        }),
      });

      const result = isPageCallbackCallLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {evaluate(fn), bare callee} => returns false', () => {
      isPageCallbackCallLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.CallExpression,
        callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'evaluate' }),
      });

      const result = isPageCallbackCallLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {node is a MemberExpression, not a call} => returns false', () => {
      isPageCallbackCallLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        computed: false,
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'evaluate' }),
      });

      const result = isPageCallbackCallLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('EMPTY: {node: undefined} => returns false', () => {
      isPageCallbackCallLayerBrokerProxy();

      const result = isPageCallbackCallLayerBroker({});

      expect(result).toBe(false);
    });
  });
});
