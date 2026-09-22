import { elementDeltaComputeTransformer } from './element-delta-compute-transformer';
import { KeyListingStub } from '../../contracts/key-listing/key-listing.stub';
import { KeyRowStub } from '../../contracts/key-row/key-row.stub';
import { ElementDeltaStub } from '../../contracts/element-delta/element-delta.stub';

describe('elementDeltaComputeTransformer', () => {
  describe('matched elements', () => {
    it('VALID: {same row in both readings} => returns a delta with all three arrays empty', () => {
      const row = KeyRowStub({ testId: 'save-button', tag: 'button', text: 'Save' });
      const before = KeyListingStub({ rows: [row] });
      const after = KeyListingStub({ rows: [row] });

      const result = elementDeltaComputeTransformer({ before, after });

      expect(result).toStrictEqual(ElementDeltaStub());
    });

    it('VALID: {matched row with a different text} => returns the pair in changed', () => {
      const beforeRow = KeyRowStub({ testId: 'quest-status', text: 'pending' });
      const afterRow = KeyRowStub({ testId: 'quest-status', text: 'in_progress' });
      const before = KeyListingStub({ rows: [beforeRow] });
      const after = KeyListingStub({ rows: [afterRow] });

      const result = elementDeltaComputeTransformer({ before, after });

      expect(result).toStrictEqual(
        ElementDeltaStub({ changed: [{ before: beforeRow, after: afterRow }] }),
      );
    });

    it('VALID: {two identical multi-row readings} => returns a delta with all three arrays empty', () => {
      const rowA = KeyRowStub({ ref: 1, testId: 'row-a' });
      const rowB = KeyRowStub({ ref: 2, testId: 'row-b', text: 'B' });
      const before = KeyListingStub({ rows: [rowA, rowB] });
      const after = KeyListingStub({ rows: [rowA, rowB] });

      const result = elementDeltaComputeTransformer({ before, after });

      expect(result).toStrictEqual(ElementDeltaStub());
    });
  });

  describe('appeared and disappeared', () => {
    it('VALID: {a row only in the second reading} => returns it in appeared', () => {
      const existingRow = KeyRowStub({ ref: 1, testId: 'save-button' });
      const newRow = KeyRowStub({ ref: 2, testId: 'cancel-button' });
      const before = KeyListingStub({ rows: [existingRow] });
      const after = KeyListingStub({ rows: [existingRow, newRow] });

      const result = elementDeltaComputeTransformer({ before, after });

      expect(result).toStrictEqual(ElementDeltaStub({ appeared: [newRow] }));
    });

    it('VALID: {a row only in the first reading} => returns it in disappeared', () => {
      const survivingRow = KeyRowStub({ ref: 1, testId: 'save-button' });
      const removedRow = KeyRowStub({ ref: 2, testId: 'cancel-button' });
      const before = KeyListingStub({ rows: [survivingRow, removedRow] });
      const after = KeyListingStub({ rows: [survivingRow] });

      const result = elementDeltaComputeTransformer({ before, after });

      expect(result).toStrictEqual(ElementDeltaStub({ disappeared: [removedRow] }));
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {before has no rows} => returns every row of the second reading as appeared', () => {
      const row = KeyRowStub({ testId: 'first-load-banner' });
      const before = KeyListingStub({ rows: [] });
      const after = KeyListingStub({ rows: [row] });

      const result = elementDeltaComputeTransformer({ before, after });

      expect(result).toStrictEqual(ElementDeltaStub({ appeared: [row] }));
    });

    it('EDGE: {same testId under two different parents} => scopes each independently instead of cross-matching', () => {
      const panelA = KeyRowStub({ ref: 1, depth: 0, testId: 'panel-a' });
      const closeUnderA = KeyRowStub({ ref: 2, depth: 1, testId: 'close', tag: 'button' });
      const panelB = KeyRowStub({ ref: 3, depth: 0, testId: 'panel-b' });
      const closeUnderB = KeyRowStub({ ref: 4, depth: 1, testId: 'close', tag: 'button' });
      const before = KeyListingStub({ rows: [panelA, closeUnderA, panelB, closeUnderB] });
      const after = KeyListingStub({ rows: [panelB, closeUnderB] });

      const result = elementDeltaComputeTransformer({ before, after });

      expect(result).toStrictEqual(ElementDeltaStub({ disappeared: [panelA, closeUnderA] }));
    });
  });
});
