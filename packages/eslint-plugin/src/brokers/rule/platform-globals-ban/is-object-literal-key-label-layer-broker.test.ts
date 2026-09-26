import { isObjectLiteralKeyLabelLayerBroker } from './is-object-literal-key-label-layer-broker';
import { isObjectLiteralKeyLabelLayerBrokerProxy } from './is-object-literal-key-label-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

// The true case (node IS the parent's key) needs `parent.key === node`, an object-identity check
// that `tsestreeContract.parse` cannot preserve through a stub (every nested field gets re-parsed
// into its own object) — a real ESLint-parsed AST never has this problem. That branch is covered by
// rule-platform-globals-ban-broker's own RuleTester integration test instead, against real parsed
// code.
describe('isObjectLiteralKeyLabelLayerBroker', () => {
  describe('not a key label', () => {
    it('INVALID: {parent is not a Property} => returns false', () => {
      isObjectLiteralKeyLabelLayerBrokerProxy();
      const node = TsestreeStub({
        parent: TsestreeStub({ type: TsestreeNodeType.MemberExpression }),
      });

      const result = isObjectLiteralKeyLabelLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('EMPTY: {no parent} => returns false', () => {
      isObjectLiteralKeyLabelLayerBrokerProxy();
      const node = TsestreeStub({ parent: null });

      const result = isObjectLiteralKeyLabelLayerBroker({ node });

      expect(result).toBe(false);
    });
  });
});
