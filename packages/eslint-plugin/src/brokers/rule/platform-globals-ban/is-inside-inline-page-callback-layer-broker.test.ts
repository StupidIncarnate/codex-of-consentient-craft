import { isInsideInlinePageCallbackLayerBroker } from './is-inside-inline-page-callback-layer-broker';
import { isInsideInlinePageCallbackLayerBrokerProxy } from './is-inside-inline-page-callback-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

// The true case needs `call.arguments[0] === fn`, an object-identity check that
// `tsestreeContract.parse` cannot preserve through a stub (every nested field is re-parsed into its
// own object). It is covered by rule-platform-globals-ban-broker's RuleTester integration test,
// against real parsed code.
describe('isInsideInlinePageCallbackLayerBroker', () => {
  describe('outside any browser-side callback', () => {
    it('INVALID: {identifier with no enclosing function} => returns false', () => {
      isInsideInlinePageCallbackLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'document',
        parent: TsestreeStub({
          type: TsestreeNodeType.ExpressionStatement,
          parent: TsestreeStub({ type: TsestreeNodeType.Program }),
        }),
      });

      const result = isInsideInlinePageCallbackLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {identifier inside an arrow passed to page.click} => returns false', () => {
      isInsideInlinePageCallbackLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'document',
        parent: TsestreeStub({
          type: TsestreeNodeType.ArrowFunctionExpression,
          parent: TsestreeStub({
            type: TsestreeNodeType.CallExpression,
            callee: TsestreeStub({
              type: TsestreeNodeType.MemberExpression,
              computed: false,
              property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'click' }),
            }),
          }),
        }),
      });

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
