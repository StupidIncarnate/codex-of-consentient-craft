import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { astCollectNodesTransformer } from '../../../transformers/ast-collect-nodes/ast-collect-nodes-transformer';
import { sameObjectExemptionLayerBroker } from './same-object-exemption-layer-broker';
import { sameObjectExemptionLayerBrokerProxy } from './same-object-exemption-layer-broker.proxy';

describe('sameObjectExemptionLayerBroker', () => {
  describe('the field is a const listed beside the id in a parsed object', () => {
    it.each([
      [
        'VALID: {shorthand id, const folder read from id} => true',
        'const folder = questContract.shape.folder.parse(fields.folder ?? id); const quest = questContract.parse({ ...parsedFields, id, folder, createdAt });',
        true,
      ],
      [
        'VALID: {id: quest.id, folder parsed from quest.id} => true',
        'const folder = questContract.shape.folder.parse(quest.id); const made = questContract.parse({ id: quest.id, folder });',
        true,
      ],
      [
        'VALID: {const renamed in the object, id read} => true',
        'const home = questContract.shape.folder.parse(id); const made = questContract.parse({ id, folder: home });',
        true,
      ],
      [
        'VALID: {safeParse as the whole parse} => true',
        'const folder = questContract.shape.folder.parse(id); const made = questContract.safeParse({ id, folder });',
        true,
      ],
      [
        'INVALID: {a different object id} => false',
        'const folder = questContract.shape.folder.parse(other.id); const made = questContract.parse({ id, folder });',
        false,
      ],
      [
        'INVALID: {the object is not parsed} => false',
        'const folder = questContract.shape.folder.parse(id); const made = { id, folder };',
        false,
      ],
      [
        'INVALID: {no id property in the parsed object} => false',
        'const folder = questContract.shape.folder.parse(id); const made = questContract.parse({ folder });',
        false,
      ],
      [
        'INVALID: {the const is not listed in the parsed object} => false',
        'const folder = questContract.shape.folder.parse(id); const made = questContract.parse({ id });',
        false,
      ],
      [
        'INVALID: {id only appears as a member name} => false',
        'const folder = questContract.shape.folder.parse(fields.id); const made = questContract.parse({ id, folder });',
        false,
      ],
    ])('%s', (_name, code, expected) => {
      sameObjectExemptionLayerBrokerProxy();
      const node = CallExpressionStub({ code });

      const result = sameObjectExemptionLayerBroker({ node });

      expect(result).toBe(expected);
    });
  });

  describe('the field is a property of the parsed object itself', () => {
    it.each([
      [
        'VALID: {id and folder in one parsed literal} => true',
        'questContract.parse({ id, folder: questContract.shape.folder.parse(fields.folder ?? id) });',
        true,
      ],
      [
        'INVALID: {literal is a plain object, not parsed} => false',
        'build({ id, folder: questContract.shape.folder.parse(id) });',
        false,
      ],
      [
        'INVALID: {spread copy of another work item} => false',
        'questContract.parse({ ...item, mintedBy: workItemContract.shape.mintedBy.parse(parent.id) });',
        false,
      ],
    ])('%s', (_name, code, expected) => {
      sameObjectExemptionLayerBrokerProxy();
      const [node] = astCollectNodesTransformer({
        node: CallExpressionStub({ code }),
        type: AST_NODE_TYPES.CallExpression,
      });

      const result = sameObjectExemptionLayerBroker({ node });

      expect(result).toBe(expected);
    });
  });

  describe('nodes that are not a field parse with an argument', () => {
    it('EMPTY: {parse call with no argument} => false', () => {
      sameObjectExemptionLayerBrokerProxy();
      const node = CallExpressionStub({
        code: 'const folder = questContract.shape.folder.parse();',
      });

      const result = sameObjectExemptionLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {parse call that is an expression statement} => false', () => {
      sameObjectExemptionLayerBrokerProxy();
      const node = CallExpressionStub({ code: 'questContract.shape.folder.parse(id);' });

      const result = sameObjectExemptionLayerBroker({ node });

      expect(result).toBe(false);
    });

    it('INVALID: {identifier node} => false', () => {
      sameObjectExemptionLayerBrokerProxy();
      const node = IdentifierStub({ code: 'folder;' });

      const result = sameObjectExemptionLayerBroker({ node });

      expect(result).toBe(false);
    });
  });
});
