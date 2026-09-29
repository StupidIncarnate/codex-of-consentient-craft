import { astBrandPathTransformer } from './ast-brand-path-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

const identifier = ({ name }: { name: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({ type: TsestreeNodeType.Identifier, name });

const declaratorNamed = ({ name }: { name: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({ type: TsestreeNodeType.VariableDeclarator, id: identifier({ name }) });

const propertyKeyed = ({ name }: { name: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({ type: TsestreeNodeType.Property, key: identifier({ name }) });

const zCall = ({ method }: { method: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.CallExpression,
    callee: TsestreeStub({
      type: TsestreeNodeType.MemberExpression,
      object: identifier({ name: 'z' }),
      property: identifier({ name: method }),
    }),
  });

describe('astBrandPathTransformer', () => {
  describe('owner and keys', () => {
    it("VALID: {node under id of questContract} => returns ['questContract', 'id']", () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const property = propertyKeyed({ name: 'id' });
      const declarator = declaratorNamed({ name: 'questContract' });
      node.parent = property;
      property.parent = declarator;

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'id']);
    });

    it('VALID: {node under owner.name of questContract} => returns every key on the way down', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const name = propertyKeyed({ name: 'name' });
      const owner = propertyKeyed({ name: 'owner' });
      const declarator = declaratorNamed({ name: 'questContract' });
      node.parent = name;
      name.parent = owner;
      owner.parent = declarator;

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'owner', 'name']);
    });

    it("VALID: {node under a string-literal key} => reads the literal's text", () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const property = TsestreeStub({
        type: TsestreeNodeType.Property,
        key: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'kebab-key' }),
      });
      const declarator = declaratorNamed({ name: 'questContract' });
      node.parent = property;
      property.parent = declarator;

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'kebab-key']);
    });

    it("VALID: {node is the declarator's own init} => returns only the owner", () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      node.parent = declaratorNamed({ name: 'questContract' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract']);
    });
  });

  describe('record, map and tuple positions', () => {
    it("VALID: {node is the first argument of z.record} => appends 'Key'", () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const record = zCall({ method: 'record' });
      record.arguments = [node, TsestreeStub({ type: TsestreeNodeType.CallExpression })];
      const property = propertyKeyed({ name: 'counts' });
      node.parent = record;
      record.parent = property;
      property.parent = declaratorNamed({ name: 'questContract' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'counts', 'Key']);
    });

    it("VALID: {node is the first argument of z.map} => appends 'Key'", () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const map = zCall({ method: 'map' });
      map.arguments = [node, TsestreeStub({ type: TsestreeNodeType.CallExpression })];
      const property = propertyKeyed({ name: 'byId' });
      node.parent = map;
      map.parent = property;
      property.parent = declaratorNamed({ name: 'questContract' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'byId', 'Key']);
    });

    it('VALID: {node is the value argument of z.record} => adds nothing for the value', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const record = zCall({ method: 'record' });
      record.arguments = [TsestreeStub({ type: TsestreeNodeType.CallExpression }), node];
      const property = propertyKeyed({ name: 'counts' });
      node.parent = record;
      record.parent = property;
      property.parent = declaratorNamed({ name: 'questContract' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'counts']);
    });

    it("VALID: {node is the second position of z.tuple} => appends its index '1'", () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const positions = TsestreeStub({ type: TsestreeNodeType.ArrayExpression });
      positions.elements = [TsestreeStub({ type: TsestreeNodeType.CallExpression }), node];
      const tuple = zCall({ method: 'tuple' });
      const property = propertyKeyed({ name: 'span' });
      node.parent = positions;
      positions.parent = tuple;
      tuple.parent = property;
      property.parent = declaratorNamed({ name: 'questContract' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'span', '1']);
    });

    it('VALID: {node in an array literal that is not a z.tuple argument} => adds no index', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      const positions = TsestreeStub({ type: TsestreeNodeType.ArrayExpression });
      positions.elements = [node];
      const union = zCall({ method: 'union' });
      const property = propertyKeyed({ name: 'either' });
      node.parent = positions;
      positions.parent = union;
      union.parent = property;
      property.parent = declaratorNamed({ name: 'questContract' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual(['questContract', 'either']);
    });
  });

  describe('no owner', () => {
    it('EMPTY: {node with no declarator above it} => returns an empty path', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });
      node.parent = propertyKeyed({ name: 'id' });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {node with no parent} => returns an empty path', () => {
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });

      const result = astBrandPathTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });
});
