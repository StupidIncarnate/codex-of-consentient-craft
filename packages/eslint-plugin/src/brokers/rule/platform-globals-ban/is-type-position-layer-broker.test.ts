import { isTypePositionLayerBroker } from './is-type-position-layer-broker';
import { isTypePositionLayerBrokerProxy } from './is-type-position-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('isTypePositionLayerBroker', () => {
  describe('type positions', () => {
    it('VALID: {parent: TSTypeReference} => returns true', () => {
      isTypePositionLayerBrokerProxy();
      const node = TsestreeStub({
        parent: TsestreeStub({ type: TsestreeNodeType.TSTypeReference }),
      });

      const result = isTypePositionLayerBroker({ node });

      expect(result).toBe(true);
    });

    it('VALID: {parent: TSQualifiedName} => returns true', () => {
      isTypePositionLayerBrokerProxy();
      const node = TsestreeStub({
        parent: TsestreeStub({ type: TsestreeNodeType.TSQualifiedName }),
      });

      const result = isTypePositionLayerBroker({ node });

      expect(result).toBe(true);
    });
  });

  describe('value positions', () => {
    it('INVALID: {parent: MemberExpression} => returns false', () => {
      isTypePositionLayerBrokerProxy();
      const node = TsestreeStub({
        parent: TsestreeStub({ type: TsestreeNodeType.MemberExpression }),
      });

      const result = isTypePositionLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('EMPTY: {no parent} => returns false', () => {
      isTypePositionLayerBrokerProxy();
      const node = TsestreeStub({ parent: null });

      const result = isTypePositionLayerBroker({ node });

      expect(result).toBe(false);
    });
  });
});
