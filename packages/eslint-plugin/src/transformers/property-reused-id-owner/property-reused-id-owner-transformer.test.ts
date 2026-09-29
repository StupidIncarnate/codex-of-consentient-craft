import { propertyReusedIdOwnerTransformer } from './property-reused-id-owner-transformer';

describe('propertyReusedIdOwnerTransformer', () => {
  it("VALID: {text: plain reuse} => returns 'questContract'", () => {
    const result = propertyReusedIdOwnerTransformer({ text: 'questId: questContract.shape.id' });

    expect(result).toBe('questContract');
  });

  it("VALID: {text: getter reuse} => returns 'questContract'", () => {
    const result = propertyReusedIdOwnerTransformer({
      text: "get questId(): z.core.$ZodType<string & z.$brand<'QuestId'>> {\n return questContract.shape.id;\n }",
    });

    expect(result).toBe('questContract');
  });

  it('EMPTY: {text: own schema} => returns null', () => {
    const result = propertyReusedIdOwnerTransformer({ text: 'questId: z.string()' });

    expect(result).toBe(null);
  });

  it('EMPTY: {text: reuse of another field} => returns null', () => {
    const result = propertyReusedIdOwnerTransformer({ text: 'name: questContract.shape.name' });

    expect(result).toBe(null);
  });
});
