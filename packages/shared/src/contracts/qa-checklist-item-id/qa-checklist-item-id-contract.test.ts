import { qaChecklistItemIdContract } from './qa-checklist-item-id-contract';
import { QaChecklistItemIdStub } from './qa-checklist-item-id.stub';

describe('qaChecklistItemIdContract', () => {
  describe('valid three-segment ids', () => {
    it('VALID: {observable id} => parses', () => {
      expect(
        QaChecklistItemIdStub({
          value: 'view-persisted-comments:observable:check-badge-count-text',
        }),
      ).toBe('view-persisted-comments:observable:check-badge-count-text');
    });

    it('VALID: {terminal id} => parses', () => {
      expect(
        QaChecklistItemIdStub({ value: 'send-queued-comment-batch:terminal:persist-failed' }),
      ).toBe('send-queued-comment-batch:terminal:persist-failed');
    });

    it('VALID: {branch id} => parses', () => {
      expect(
        QaChecklistItemIdStub({ value: 'orphan-comment-cleanup:branch:touches-flows-no' }),
      ).toBe('orphan-comment-cleanup:branch:touches-flows-no');
    });

    it('VALID: {off-map kind, itself hyphenated} => parses', () => {
      expect(
        QaChecklistItemIdStub({ value: 'leave-comment-on-diagram-box:off-map:hostile-input' }),
      ).toBe('leave-comment-on-diagram-box:off-map:hostile-input');
    });

    it('EDGE: {single-character segments} => parses', () => {
      expect(QaChecklistItemIdStub({ value: 'a:b:c' })).toBe('a:b:c');
    });

    it('EDGE: {digits after the leading letter} => parses', () => {
      expect(QaChecklistItemIdStub({ value: 'flow2:observable:check-400-body' })).toBe(
        'flow2:observable:check-400-body',
      );
    });
  });

  describe('determinism', () => {
    it('VALID: {same source segments parsed twice} => yields byte-identical ids, so a later session resumes against a prior ledger', () => {
      expect(qaChecklistItemIdContract.parse('a-flow:observable:check-one')).toBe(
        qaChecklistItemIdContract.parse('a-flow:observable:check-one'),
      );
    });
  });

  describe('invalid shapes', () => {
    it('INVALID: {two segments} => reports failure', () => {
      expect(qaChecklistItemIdContract.safeParse('some-flow:observable').success).toBe(false);
    });

    it('INVALID: {four segments} => throws', () => {
      expect(() => QaChecklistItemIdStub({ value: 'a:b:c:d' })).toThrow(/Invalid/u);
    });

    it('INVALID: {empty middle segment} => throws', () => {
      expect(() => QaChecklistItemIdStub({ value: 'some-flow::check-thing' })).toThrow(/Invalid/u);
    });

    it('INVALID: {uppercase segment} => throws', () => {
      expect(() => QaChecklistItemIdStub({ value: 'someFlow:observable:checkThing' })).toThrow(
        /Invalid/u,
      );
    });

    it('INVALID: {segment starting with a digit} => throws', () => {
      expect(() => QaChecklistItemIdStub({ value: '2flow:observable:check-thing' })).toThrow(
        /Invalid/u,
      );
    });

    it('INVALID: {trailing hyphen} => throws', () => {
      expect(() => QaChecklistItemIdStub({ value: 'some-flow:observable:check-' })).toThrow(
        /Invalid/u,
      );
    });

    it('EMPTY: {empty string} => throws', () => {
      expect(() => QaChecklistItemIdStub({ value: '' })).toThrow(/Invalid/u);
    });
  });
});
