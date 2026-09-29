import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isInsideInlinePageCallbackLayerBroker } from './is-inside-inline-page-callback-layer-broker';
import { isInsideInlinePageCallbackLayerBrokerProxy } from './is-inside-inline-page-callback-layer-broker.proxy';

// The true case needs `call.arguments[0] === fn`, an object-identity check that
// `tsestreeContract.parse` cannot preserve through a stub (every nested field is re-parsed into its
// own object). It is covered by rule-platform-globals-ban-broker's RuleTester integration test,
// against real parsed code.
describe('isInsideInlinePageCallbackLayerBroker', () => {
  describe('outside any browser-side callback', () => {
    it('INVALID: {identifier with no enclosing function} => returns false', () => {
      isInsideInlinePageCallbackLayerBrokerProxy();
      const node = IdentifierStub({ code: 'document;' });

      const result = isInsideInlinePageCallbackLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {identifier inside an arrow passed to page.click} => returns false', () => {
      isInsideInlinePageCallbackLayerBrokerProxy();
      const node = IdentifierStub({ code: '(() => document)();' });

      const result = isInsideInlinePageCallbackLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('EMPTY: {node: undefined} => returns false', () => {
      isInsideInlinePageCallbackLayerBrokerProxy();

      const result = isInsideInlinePageCallbackLayerBroker({});

      expect(result).toBe(false);
    });
  });
});
