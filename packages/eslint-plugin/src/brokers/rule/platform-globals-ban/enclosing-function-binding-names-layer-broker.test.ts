import { enclosingFunctionBindingNamesLayerBroker } from './enclosing-function-binding-names-layer-broker';
import { enclosingFunctionBindingNamesLayerBrokerProxy } from './enclosing-function-binding-names-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';

// The `const NAME = () => {}` case needs `declarator.init === fn`, an object-identity check that
// `tsestreeContract.parse` cannot preserve through a stub (every nested field is re-parsed into its
// own object). It is covered by rule-platform-globals-ban-broker's RuleTester integration test,
// against real parsed code.
describe('enclosingFunctionBindingNamesLayerBroker', () => {
  describe('named function declarations', () => {
    it('VALID: {identifier inside function readFn} => returns [readFn]', () => {
      enclosingFunctionBindingNamesLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'document',
        parent: TsestreeStub({
          type: TsestreeNodeType.FunctionDeclaration,
          id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'readFn' }),
          parent: TsestreeStub({ type: TsestreeNodeType.Program }),
        }),
      });

      const result = enclosingFunctionBindingNamesLayerBroker({ node });

      expect(result).toStrictEqual([IdentifierStub({ value: 'readFn' })]);
    });

    it('VALID: {identifier inside inner, declared inside outer} => returns [inner, outer]', () => {
      enclosingFunctionBindingNamesLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'document',
        parent: TsestreeStub({
          type: TsestreeNodeType.FunctionDeclaration,
          id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'inner' }),
          parent: TsestreeStub({
            type: TsestreeNodeType.FunctionDeclaration,
            id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'outer' }),
            parent: TsestreeStub({ type: TsestreeNodeType.Program }),
          }),
        }),
      });

      const result = enclosingFunctionBindingNamesLayerBroker({ node });

      expect(result).toStrictEqual([
        IdentifierStub({ value: 'inner' }),
        IdentifierStub({ value: 'outer' }),
      ]);
    });
  });

  describe('no named enclosing function', () => {
    it('EMPTY: {identifier inside an anonymous arrow argument} => returns []', () => {
      enclosingFunctionBindingNamesLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'document',
        parent: TsestreeStub({
          type: TsestreeNodeType.ArrowFunctionExpression,
          parent: TsestreeStub({ type: TsestreeNodeType.CallExpression }),
        }),
      });

      const result = enclosingFunctionBindingNamesLayerBroker({ node });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {node: undefined} => returns []', () => {
      enclosingFunctionBindingNamesLayerBrokerProxy();

      const result = enclosingFunctionBindingNamesLayerBroker({});

      expect(result).toStrictEqual([]);
    });
  });
});
