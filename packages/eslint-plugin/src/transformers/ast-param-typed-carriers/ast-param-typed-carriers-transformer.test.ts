import { astParamTypedCarriersTransformer } from './ast-param-typed-carriers-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

const annotation = ({
  type,
}: {
  type: ReturnType<typeof TsestreeStub>;
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.TSTypeAnnotation,
    typeAnnotation: type,
  });

const signature = ({ name }: { name: string }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.TSPropertySignature,
    key: TsestreeStub({ type: TsestreeNodeType.Identifier, name }),
    typeAnnotation: annotation({ type: TsestreeStub({ type: TsestreeNodeType.TSStringKeyword }) }),
  });

describe('astParamTypedCarriersTransformer', () => {
  describe('a plain identifier parameter', () => {
    it('VALID: {questId: string} => returns the identifier itself', () => {
      const param = TsestreeStub({
        type: TsestreeNodeType.Identifier,
        name: 'questId',
        typeAnnotation: annotation({
          type: TsestreeStub({ type: TsestreeNodeType.TSStringKeyword }),
        }),
      });

      const result = astParamTypedCarriersTransformer({ param });

      expect(result).toStrictEqual([param]);
    });

    it('EMPTY: {identifier with no written type} => returns nothing', () => {
      const param = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'questId' });

      const result = astParamTypedCarriersTransformer({ param });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a destructured parameter', () => {
    it('VALID: {inline type literal} => returns each property signature', () => {
      const questId = signature({ name: 'questId' });
      const label = signature({ name: 'label' });
      const param = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
        typeAnnotation: annotation({
          type: TsestreeStub({
            type: TsestreeNodeType.TSTypeLiteral,
            members: [questId, label],
          }),
        }),
      });

      const result = astParamTypedCarriersTransformer({ param });

      expect(result).toStrictEqual([questId, label]);
    });

    it('VALID: {destructured with a default} => reads through the left side', () => {
      const questId = signature({ name: 'questId' });
      const param = TsestreeStub({
        type: TsestreeNodeType.AssignmentPattern,
        left: TsestreeStub({
          type: TsestreeNodeType.ObjectPattern,
          typeAnnotation: annotation({
            type: TsestreeStub({ type: TsestreeNodeType.TSTypeLiteral, members: [questId] }),
          }),
        }),
      });

      const result = astParamTypedCarriersTransformer({ param });

      expect(result).toStrictEqual([questId]);
    });

    it('EMPTY: {typed by a named type} => returns nothing', () => {
      const param = TsestreeStub({
        type: TsestreeNodeType.ObjectPattern,
        typeAnnotation: annotation({
          type: TsestreeStub({ type: TsestreeNodeType.TSTypeReference }),
        }),
      });

      const result = astParamTypedCarriersTransformer({ param });

      expect(result).toStrictEqual([]);
    });
  });
});
