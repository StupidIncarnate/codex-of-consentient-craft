import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { ObjectPatternStub } from '#gateway/npm/typescript-eslint__utils/object-pattern/object-pattern.stub';
import { AssignmentPatternStub } from '#gateway/npm/typescript-eslint__utils/assignment-pattern/assignment-pattern.stub';
import { astParamTypedCarriersTransformer } from './ast-param-typed-carriers-transformer';

describe('astParamTypedCarriersTransformer', () => {
  describe('a plain identifier parameter', () => {
    it('VALID: {questId: string} => returns the identifier itself', () => {
      const param = IdentifierStub({ code: '(questId: string) => {};' });

      const result = astParamTypedCarriersTransformer({ param });

      expect(result).toStrictEqual([param]);
    });

    it('EMPTY: {identifier with no written type} => returns nothing', () => {
      const param = IdentifierStub({ code: '(questId) => {};' });

      const result = astParamTypedCarriersTransformer({ param });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a destructured parameter', () => {
    it('VALID: {inline type literal} => returns each property signature', () => {
      const code = '({}: { questId: string; label: string }) => {};';
      const param = ObjectPatternStub({ code });

      const result = astParamTypedCarriersTransformer({ param });

      expect(
        result.map((carrier) => ({ type: carrier.type, text: code.slice(...carrier.range) })),
      ).toStrictEqual([
        { type: 'TSPropertySignature', text: 'questId: string;' },
        { type: 'TSPropertySignature', text: 'label: string' },
      ]);
    });

    it('VALID: {destructured with a default} => reads through the left side', () => {
      const code = '({}: { questId: string } = {}) => {};';
      const param = AssignmentPatternStub({ code });

      const result = astParamTypedCarriersTransformer({ param });

      expect(
        result.map((carrier) => ({ type: carrier.type, text: code.slice(...carrier.range) })),
      ).toStrictEqual([{ type: 'TSPropertySignature', text: 'questId: string' }]);
    });

    it('EMPTY: {typed by a named type} => returns nothing', () => {
      const param = ObjectPatternStub({ code: '({}: T) => {};' });

      const result = astParamTypedCarriersTransformer({ param });

      expect(result).toStrictEqual([]);
    });
  });
});
