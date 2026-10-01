import { familyWholeScopeStepTransformer } from './family-whole-scope-step-transformer';

describe('familyWholeScopeStepTransformer', () => {
  describe('unit-bearing families', () => {
    it('VALID: {family: codeweaver} => returns plan', () => {
      expect(familyWholeScopeStepTransformer({ family: 'codeweaver' })).toBe('plan');
    });

    it('VALID: {family: flowrider} => returns plan', () => {
      expect(familyWholeScopeStepTransformer({ family: 'flowrider' })).toBe('plan');
    });

    it('VALID: {family: siegemaster} => returns plan, not its sweepIn entry step', () => {
      expect(familyWholeScopeStepTransformer({ family: 'siegemaster' })).toBe('plan');
    });
  });

  describe('families that measure no units', () => {
    it('EMPTY: {family: wardFull} => returns undefined', () => {
      expect(familyWholeScopeStepTransformer({ family: 'wardFull' })).toBe(undefined);
    });

    it('EMPTY: {family: riftcarver} => returns undefined', () => {
      expect(familyWholeScopeStepTransformer({ family: 'riftcarver' })).toBe(undefined);
    });
  });
});
