import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';

import { astExpectedBrandTextTransformer } from './ast-expected-brand-text-transformer';

describe('astExpectedBrandTextTransformer', () => {
  describe('an owner with the field beneath it', () => {
    it("VALID: {id under questContract} => returns 'QuestId'", () => {
      const node = CallExpressionStub({ code: 'const questContract = { id: brand() };' });

      const result = astExpectedBrandTextTransformer({ node, fieldListOwners: new Map() });

      expect(result).toBe('QuestId');
    });

    it("VALID: {name under a field list} => the list's owner supplies the name", () => {
      const node = CallExpressionStub({ code: 'const treeNodeFields = { name: brand() };' });
      const fieldListOwners = new Map([
        [
          IdentifierStub({ value: 'treeNodeFields' }),
          IdentifierStub({ value: 'treeNodeContract' }),
        ],
      ]);

      const result = astExpectedBrandTextTransformer({ node, fieldListOwners });

      expect(result).toBe('TreeNodeName');
    });
  });

  describe('a node no const owns', () => {
    it('EMPTY: {node with no parent} => returns null', () => {
      const node = CallExpressionStub({ code: 'f();' });

      const result = astExpectedBrandTextTransformer({ node, fieldListOwners: new Map() });

      expect(result).toBe(null);
    });
  });
});
