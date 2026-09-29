import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { TSTypeReferenceStub } from '#gateway/npm/typescript-eslint__utils/ts-type-reference/ts-type-reference.stub';
import { TSQualifiedNameStub } from '#gateway/npm/typescript-eslint__utils/ts-qualified-name/ts-qualified-name.stub';
import { isTypePositionLayerBroker } from './is-type-position-layer-broker';
import { isTypePositionLayerBrokerProxy } from './is-type-position-layer-broker.proxy';

describe('isTypePositionLayerBroker', () => {
  describe('type positions', () => {
    it('VALID: {parent: TSTypeReference} => returns true', () => {
      isTypePositionLayerBrokerProxy();
      const { typeName: node } = TSTypeReferenceStub({ code: 'let x: Buffer;' });

      const result = isTypePositionLayerBroker({ node });

      expect(result).toBe(true);
    });

    it('VALID: {parent: TSQualifiedName} => returns true', () => {
      isTypePositionLayerBrokerProxy();
      const { left: node } = TSQualifiedNameStub({ code: 'let x: NodeJS.ErrnoException;' });

      const result = isTypePositionLayerBroker({ node });

      expect(result).toBe(true);
    });
  });

  describe('value positions', () => {
    it('INVALID: {parent: MemberExpression} => returns false', () => {
      isTypePositionLayerBrokerProxy();
      const node = IdentifierStub({ code: 'x.b;' });

      const result = isTypePositionLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('EMPTY: {no parent} => returns false', () => {
      isTypePositionLayerBrokerProxy();
      const node = ProgramStub({ code: '' });

      const result = isTypePositionLayerBroker({ node });

      expect(result).toBe(false);
    });
  });
});
