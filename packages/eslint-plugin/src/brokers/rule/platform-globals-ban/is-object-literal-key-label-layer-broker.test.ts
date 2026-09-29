import { PropertyStub } from '#gateway/npm/typescript-eslint__utils/property/property.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { isObjectLiteralKeyLabelLayerBroker } from './is-object-literal-key-label-layer-broker';
import { isObjectLiteralKeyLabelLayerBrokerProxy } from './is-object-literal-key-label-layer-broker.proxy';

describe('isObjectLiteralKeyLabelLayerBroker', () => {
  describe('a key label', () => {
    it('VALID: {node is the key of its Property} => returns true', () => {
      isObjectLiteralKeyLabelLayerBrokerProxy();
      const { key: node } = PropertyStub({ code: '({ stdout: 1 });' });

      const result = isObjectLiteralKeyLabelLayerBroker({ node });

      expect(result).toBe(true);
    });
  });

  describe('not a key label', () => {
    it('INVALID: {node is the value of its Property} => returns false', () => {
      isObjectLiteralKeyLabelLayerBrokerProxy();
      const { value: node } = PropertyStub({ code: '({ a: stdout });' });

      const result = isObjectLiteralKeyLabelLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('EMPTY: {no parent} => returns false', () => {
      isObjectLiteralKeyLabelLayerBrokerProxy();
      const node = ProgramStub({ code: '' });

      const result = isObjectLiteralKeyLabelLayerBroker({ node });

      expect(result).toBe(false);
    });
  });
});
