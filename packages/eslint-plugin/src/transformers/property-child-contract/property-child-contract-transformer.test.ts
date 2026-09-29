import { propertyChildContractTransformer } from './property-child-contract-transformer';

describe('propertyChildContractTransformer', () => {
  it("VALID: {text: 'quest: questContract'} => returns 'questContract'", () => {
    const result = propertyChildContractTransformer({ text: 'quest: questContract' });

    expect(result).toBe('questContract');
  });

  it("VALID: {text: 'quest:questContract '} => returns 'questContract'", () => {
    const result = propertyChildContractTransformer({ text: 'quest:questContract ' });

    expect(result).toBe('questContract');
  });

  it('EMPTY: {text: optional wrapper} => returns null', () => {
    const result = propertyChildContractTransformer({ text: 'quest: questContract.optional()' });

    expect(result).toBe(null);
  });

  it('EMPTY: {text: shape reuse} => returns null', () => {
    const result = propertyChildContractTransformer({ text: 'questId: questContract.shape.id' });

    expect(result).toBe(null);
  });

  it('EMPTY: {text: bare Contract} => returns null', () => {
    const result = propertyChildContractTransformer({ text: 'x: Contract' });

    expect(result).toBe(null);
  });
});
