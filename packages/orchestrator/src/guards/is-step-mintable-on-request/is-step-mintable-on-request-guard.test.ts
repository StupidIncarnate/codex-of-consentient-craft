import { isStepMintableOnRequestGuard } from './is-step-mintable-on-request-guard';

describe('isStepMintableOnRequestGuard', () => {
  it("VALID: {family: 'siegemaster', step: 'recipe'} => returns true", () => {
    const result = isStepMintableOnRequestGuard({
      family: 'siegemaster',
      step: 'recipe' as never,
    });

    expect(result).toBe(true);
  });

  it("VALID: {family: 'siegemaster', step: 'read'} => returns true", () => {
    const result = isStepMintableOnRequestGuard({
      family: 'siegemaster',
      step: 'read' as never,
    });

    expect(result).toBe(true);
  });

  it("INVALID: {family: 'siegemaster', step: 'happyWalk'} => returns false, not mintableOnRequest", () => {
    const result = isStepMintableOnRequestGuard({
      family: 'siegemaster',
      step: 'happyWalk' as never,
    });

    expect(result).toBe(false);
  });

  it("INVALID: {family: 'codeweaver', step: 'recipe'} => returns false, codeweaver has no recipe step", () => {
    const result = isStepMintableOnRequestGuard({
      family: 'codeweaver',
      step: 'recipe' as never,
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {family: undefined} => returns false', () => {
    const result = isStepMintableOnRequestGuard({ step: 'recipe' as never });

    expect(result).toBe(false);
  });

  it('EMPTY: {step: undefined} => returns false', () => {
    const result = isStepMintableOnRequestGuard({
      family: 'siegemaster',
    });

    expect(result).toBe(false);
  });
});
