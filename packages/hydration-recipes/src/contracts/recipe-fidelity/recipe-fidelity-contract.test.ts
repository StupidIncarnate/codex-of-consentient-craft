import { recipeFidelityStatics } from '../../statics/recipe-fidelity/recipe-fidelity-statics';

import { recipeFidelityContract } from './recipe-fidelity-contract';
import { RecipeFidelityStub } from './recipe-fidelity.stub';

describe('recipeFidelityContract', () => {
  describe('valid markers', () => {
    it.each(recipeFidelityStatics.markers.all)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const fidelity = RecipeFidelityStub({ value });

        const result = recipeFidelityContract.parse(fidelity);

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid markers', () => {
    it("INVALID: {value: 'synthetic'} => a fourth marker nobody declared throws validation error", () => {
      expect(() => {
        RecipeFidelityStub({ value: 'synthetic' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it("INVALID: {value: 'Direct'} => the marker is case-sensitive", () => {
      expect(() => {
        RecipeFidelityStub({ value: 'Direct' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
