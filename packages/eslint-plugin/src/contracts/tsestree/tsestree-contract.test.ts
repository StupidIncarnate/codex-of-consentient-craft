import { tsestreeContract } from './tsestree-contract';
import { TsestreeStub, TsestreeNodeType } from './tsestree.stub';

describe('TsestreeStub', () => {
  it('VALID: {} => returns default Tsestree', () => {
    const result = TsestreeStub();

    expect(result.type).toBe(TsestreeNodeType.Identifier);
    expect(result.parent).toBeNull();

    // Validate contract parsing
    expect(() => tsestreeContract.parse(result)).not.toThrow();
  });

  it('VALID: {type: TsestreeNodeType.CallExpression} => returns Tsestree with custom type', () => {
    const result = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
    });

    expect(result.type).toBe(TsestreeNodeType.CallExpression);
  });

  it('VALID: {parent: node} => returns Tsestree with parent', () => {
    const parent = TsestreeStub({ type: TsestreeNodeType.Program });
    const result = TsestreeStub({
      type: TsestreeNodeType.Identifier,
      parent,
    });

    expect(result.parent).toStrictEqual(parent);
    expect(result.parent?.type).toBe(TsestreeNodeType.Program);
  });

  it('INVALID_TYPE: {type: ""} => throws ZodError for invalid enum value', () => {
    expect(() => {
      TsestreeStub({
        type: '' as unknown as typeof TsestreeNodeType.Identifier,
      });
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID_TYPE: {type: "InvalidNodeType"} => throws ZodError for invalid enum value', () => {
    expect(() => {
      TsestreeStub({
        type: 'InvalidNodeType' as unknown as typeof TsestreeNodeType.Identifier,
      });
    }).toThrow(/Invalid enum value/u);
  });
});
