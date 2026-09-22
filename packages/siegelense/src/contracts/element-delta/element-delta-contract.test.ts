import { elementDeltaContract } from './element-delta-contract';
import { ElementDeltaStub } from './element-delta.stub';
import { KeyRowStub } from '../key-row/key-row.stub';

describe('elementDeltaContract', () => {
  describe('valid deltas', () => {
    it('VALID: {no overrides} => parses to a delta with all three arrays empty', () => {
      const delta = ElementDeltaStub();

      const result = elementDeltaContract.parse(delta);

      expect(result).toStrictEqual({ appeared: [], disappeared: [], changed: [] });
    });

    it('VALID: {appeared: [row]} => parses with the row carried in appeared', () => {
      const row = KeyRowStub({ testId: 'save-button' });
      const delta = ElementDeltaStub({ appeared: [row] });

      const result = elementDeltaContract.parse(delta);

      expect(result).toStrictEqual({ appeared: [row], disappeared: [], changed: [] });
    });

    it('VALID: {changed: [{before, after}]} => parses with the whole pair carried in changed', () => {
      const before = KeyRowStub({ testId: 'quest-status', text: 'pending' });
      const after = KeyRowStub({ testId: 'quest-status', text: 'in_progress' });
      const delta = ElementDeltaStub({ changed: [{ before, after }] });

      const result = elementDeltaContract.parse(delta);

      expect(result).toStrictEqual({ appeared: [], disappeared: [], changed: [{ before, after }] });
    });
  });

  describe('invalid deltas', () => {
    it("INVALID: {+moved} => throws naming the stray key, because 'moved' is a comparison this shape does not attempt", () => {
      expect(() =>
        elementDeltaContract.parse({ ...ElementDeltaStub(), moved: 2 } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'moved'/u);
    });

    it('INVALID: {changed: [{before only}]} => throws Required for the missing "after" field', () => {
      expect(() =>
        elementDeltaContract.parse({
          ...ElementDeltaStub(),
          changed: [{ before: KeyRowStub() }],
        }),
      ).toThrow(/Required/u);
    });
  });
});
