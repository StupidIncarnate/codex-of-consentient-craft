import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';

import { astExpectedBrandTextTransformer } from './ast-expected-brand-text-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

const brandUnder = ({
  owner,
  key,
}: {
  owner: string;
  key: string;
}): ReturnType<typeof TsestreeStub> => {
  const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
  const property = TsestreeStub({
    type: TsestreeNodeType.Property,
    key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: key }),
  });
  const declarator = TsestreeStub({
    type: TsestreeNodeType.VariableDeclarator,
    id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: owner }),
  });
  node.parent = property;
  property.parent = declarator;
  return node;
};

describe('astExpectedBrandTextTransformer', () => {
  describe('an owner with the field beneath it', () => {
    it("VALID: {id under questContract} => returns 'QuestId'", () => {
      const node = brandUnder({ owner: 'questContract', key: 'id' });

      const result = astExpectedBrandTextTransformer({ node, fieldListOwners: new Map() });

      expect(result).toBe('QuestId');
    });

    it("VALID: {name under a field list} => the list's owner supplies the name", () => {
      const node = brandUnder({ owner: 'treeNodeFields', key: 'name' });
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
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });

      const result = astExpectedBrandTextTransformer({ node, fieldListOwners: new Map() });

      expect(result).toBe(null);
    });
  });
});
