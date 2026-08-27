import { minionFamilyContract } from './minion-family-contract';
import { MinionFamilyStub } from './minion-family.stub';

describe('minionFamilyContract', () => {
  it('VALID: exported options => are exactly the three families that work a round', () => {
    expect(minionFamilyContract.options).toStrictEqual(['planner', 'worker', 'reviewer']);
  });

  it.each(minionFamilyContract.options)('VALID: {value: %s} => parses to that family', (value) => {
    expect(MinionFamilyStub({ value })).toBe(value);
  });

  it('VALID: no argument => defaults to planner', () => {
    expect(MinionFamilyStub()).toBe('planner');
  });

  // A family is the PHASE a minion occupies, never the kind of work it is doing. Accepting a
  // discipline name here would let a caller ask for a payload no tool serves, and the adapter's
  // lookup would hand back `undefined` rather than refusing.
  it('INVALID: {value: implementation} => throws, that is a kind of work and not a family', () => {
    expect(() => MinionFamilyStub({ value: 'implementation' })).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: holder} => throws, the holder is not a minion', () => {
    expect(() => MinionFamilyStub({ value: 'holder' })).toThrow(/Invalid enum value/u);
  });

  it('EMPTY: {value: empty string} => throws', () => {
    expect(() => MinionFamilyStub({ value: '' })).toThrow(/Invalid enum value/u);
  });
});
