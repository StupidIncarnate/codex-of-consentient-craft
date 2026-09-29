import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { MemberExpressionStub } from '#gateway/npm/typescript-eslint__utils/member-expression/member-expression.stub';
import { isPageCallbackCallLayerBroker } from './is-page-callback-call-layer-broker';
import { isPageCallbackCallLayerBrokerProxy } from './is-page-callback-call-layer-broker.proxy';
import { pageCallbackMethodsStatics } from '../../../statics/page-callback-methods/page-callback-methods-statics';

describe('isPageCallbackCallLayerBroker', () => {
  describe('browser-side method calls', () => {
    it.each(pageCallbackMethodsStatics.names)(
      'VALID: {page.%s(fn)} => returns true',
      (methodName) => {
        isPageCallbackCallLayerBrokerProxy();
        const node = CallExpressionStub({ code: `page.${methodName}();` });

        const result = isPageCallbackCallLayerBroker({ node });

        expect(result).toBe(true);
      },
    );
  });

  describe('other calls', () => {
    it('INVALID: {page.click()} => returns false', () => {
      isPageCallbackCallLayerBrokerProxy();
      const node = CallExpressionStub({ code: 'page.click();' });

      const result = isPageCallbackCallLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {page[evaluate](fn), computed} => returns false', () => {
      isPageCallbackCallLayerBrokerProxy();
      const node = CallExpressionStub({ code: 'page[evaluate]();' });

      const result = isPageCallbackCallLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {evaluate(fn), bare callee} => returns false', () => {
      isPageCallbackCallLayerBrokerProxy();
      const node = CallExpressionStub({ code: 'evaluate();' });

      const result = isPageCallbackCallLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {node is a MemberExpression, not a call} => returns false', () => {
      isPageCallbackCallLayerBrokerProxy();
      const node = MemberExpressionStub({ code: 'a.evaluate;' });

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
