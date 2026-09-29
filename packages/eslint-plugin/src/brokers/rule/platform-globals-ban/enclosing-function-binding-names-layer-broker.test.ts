import { ExpressionStatementStub } from '#gateway/npm/typescript-eslint__utils/expression-statement/expression-statement.stub';
import { IdentifierStub as IdentifierNodeStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { enclosingFunctionBindingNamesLayerBroker } from './enclosing-function-binding-names-layer-broker';
import { enclosingFunctionBindingNamesLayerBrokerProxy } from './enclosing-function-binding-names-layer-broker.proxy';
import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';

describe('enclosingFunctionBindingNamesLayerBroker', () => {
  describe('named function declarations', () => {
    it('VALID: {identifier inside function readFn} => returns [readFn]', () => {
      enclosingFunctionBindingNamesLayerBrokerProxy();
      const node = ExpressionStatementStub({ code: 'function readFn() { document; }' });

      const result = enclosingFunctionBindingNamesLayerBroker({ node });

      expect(result).toStrictEqual([IdentifierStub({ value: 'readFn' })]);
    });

    it('VALID: {identifier inside inner, declared inside outer} => returns [inner, outer]', () => {
      enclosingFunctionBindingNamesLayerBrokerProxy();
      const node = ExpressionStatementStub({
        code: 'function outer() { function inner() { document; } }',
      });

      const result = enclosingFunctionBindingNamesLayerBroker({ node });

      expect(result).toStrictEqual([
        IdentifierStub({ value: 'inner' }),
        IdentifierStub({ value: 'outer' }),
      ]);
    });
  });

  describe('function literals bound to a const', () => {
    it('VALID: {identifier inside const readFn = () => {}} => returns [readFn]', () => {
      enclosingFunctionBindingNamesLayerBrokerProxy();
      const node = ExpressionStatementStub({ code: 'const readFn = () => { document; };' });

      const result = enclosingFunctionBindingNamesLayerBroker({ node });

      expect(result).toStrictEqual([IdentifierStub({ value: 'readFn' })]);
    });
  });

  describe('no named enclosing function', () => {
    it('EMPTY: {identifier inside an anonymous arrow argument} => returns []', () => {
      enclosingFunctionBindingNamesLayerBrokerProxy();
      const node = IdentifierNodeStub({ code: '(() => document)();' });

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
