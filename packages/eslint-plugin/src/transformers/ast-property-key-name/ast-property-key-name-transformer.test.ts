import { astPropertyKeyNameTransformer } from './ast-property-key-name-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astPropertyKeyNameTransformer', () => {
  it("VALID: {property keyed by identifier 'questId'} => returns 'questId'", () => {
    const property = TsestreeStub({
      type: TsestreeNodeType.Property,
      key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'questId' }),
    });

    const result = astPropertyKeyNameTransformer({ property });

    expect(result).toBe('questId');
  });

  it('EMPTY: {computed property} => returns null', () => {
    const property = TsestreeStub({
      type: TsestreeNodeType.Property,
      computed: true,
      key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'questId' }),
    });

    const result = astPropertyKeyNameTransformer({ property });

    expect(result).toBe(null);
  });

  it('EMPTY: {property keyed by a literal} => returns null', () => {
    const property = TsestreeStub({
      type: TsestreeNodeType.Property,
      key: TsestreeStub({ type: TsestreeNodeType.Literal }),
    });

    const result = astPropertyKeyNameTransformer({ property });

    expect(result).toBe(null);
  });
});
