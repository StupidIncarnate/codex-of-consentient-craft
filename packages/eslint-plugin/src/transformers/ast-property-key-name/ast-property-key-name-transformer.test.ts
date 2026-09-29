import { PropertyStub } from '#gateway/npm/typescript-eslint__utils/property/property.stub';
import { astPropertyKeyNameTransformer } from './ast-property-key-name-transformer';

describe('astPropertyKeyNameTransformer', () => {
  it("VALID: {property keyed by identifier 'questId'} => returns 'questId'", () => {
    const property = PropertyStub({ code: 'const o = { questId: v };' });

    const result = astPropertyKeyNameTransformer({ property });

    expect(result).toBe('questId');
  });

  it('EMPTY: {computed property} => returns null', () => {
    const property = PropertyStub({ code: 'const o = { [questId]: v };' });

    const result = astPropertyKeyNameTransformer({ property });

    expect(result).toBe(null);
  });

  it('EMPTY: {property keyed by a literal} => returns null', () => {
    const property = PropertyStub({ code: 'const o = { 0: v };' });

    const result = astPropertyKeyNameTransformer({ property });

    expect(result).toBe(null);
  });
});
