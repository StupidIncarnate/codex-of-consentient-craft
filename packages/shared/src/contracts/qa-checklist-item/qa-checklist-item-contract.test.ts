import { qaChecklistItemContract } from './qa-checklist-item-contract';
import { QaChecklistItemStub } from './qa-checklist-item.stub';

describe('qaChecklistItemContract', () => {
  describe('observable units', () => {
    it('VALID: {observable with all anchors} => parses the complete unit', () => {
      expect(QaChecklistItemStub()).toStrictEqual({
        id: 'view-persisted-comments:observable:check-badge-count-text',
        flowId: 'view-persisted-comments',
        kind: 'observable',
        nodeId: 'render-comment-badge',
        observableId: 'check-badge-count-text',
        observableType: 'ui-state',
        label: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
        checkSurface: 'the rendered DOM in a real, attached, VISIBLE browser tab',
      });
    });

    it('VALID: {custom observable} => carries the behavioural-invariant surface rather than an I/O channel', () => {
      expect(
        QaChecklistItemStub({
          observableType: 'custom',
          checkSurface: 'a BEHAVIOURAL INVARIANT, not an I/O channel',
        }).checkSurface,
      ).toBe('a BEHAVIOURAL INVARIANT, not an I/O channel');
    });

    it('VALID: {verbatim label carrying quotes and punctuation} => is preserved byte-for-byte', () => {
      expect(
        QaChecklistItemStub({
          label:
            'a comment whose text is one unbroken token wider than the 400px FLOW_NODE_DETAIL_PANEL renders with overflow-wrap break-word',
        }).label,
      ).toBe(
        'a comment whose text is one unbroken token wider than the 400px FLOW_NODE_DETAIL_PANEL renders with overflow-wrap break-word',
      );
    });
  });

  describe('terminal units', () => {
    it('VALID: {terminal anchored to a node} => parses with no observable or edge anchors present', () => {
      expect(
        qaChecklistItemContract.parse({
          id: 'send-queued-comment-batch:terminal:persist-failed',
          flowId: 'send-queued-comment-batch',
          kind: 'terminal',
          nodeId: 'persist-failed',
          label: '500 returned, no LLM turn attempted, queue retained',
          checkSurface: 'the running system at this end state',
        }),
      ).toStrictEqual({
        id: 'send-queued-comment-batch:terminal:persist-failed',
        flowId: 'send-queued-comment-batch',
        kind: 'terminal',
        nodeId: 'persist-failed',
        label: '500 returned, no LLM turn attempted, queue retained',
        checkSurface: 'the running system at this end state',
      });
    });
  });

  describe('branch units', () => {
    it('VALID: {branch anchored to an edge} => parses with the edge anchor and no node anchor', () => {
      expect(
        qaChecklistItemContract.parse({
          id: 'orphan-comment-cleanup:branch:touches-flows-no',
          flowId: 'orphan-comment-cleanup',
          kind: 'branch',
          edgeId: 'touches-flows-no',
          label: 'payload-touches-flows —"no"→ skip-cleanup',
          checkSurface: 'the running system after forcing this branch for real',
        }),
      ).toStrictEqual({
        id: 'orphan-comment-cleanup:branch:touches-flows-no',
        flowId: 'orphan-comment-cleanup',
        kind: 'branch',
        edgeId: 'touches-flows-no',
        label: 'payload-touches-flows —"no"→ skip-cleanup',
        checkSurface: 'the running system after forcing this branch for real',
      });
    });
  });

  describe('off-map units', () => {
    it('VALID: {off-map family} => parses with the family and no graph anchor', () => {
      expect(
        qaChecklistItemContract.parse({
          id: 'leave-comment-on-diagram-box:off-map:hostile-input',
          flowId: 'leave-comment-on-diagram-box',
          kind: 'off-map',
          offMapFamily: 'hostile-input',
          label: 'Empty, whitespace-only, oversized, malformed input. Does it reject safely?',
          checkSurface: 'whatever surface the probe touches',
        }),
      ).toStrictEqual({
        id: 'leave-comment-on-diagram-box:off-map:hostile-input',
        flowId: 'leave-comment-on-diagram-box',
        kind: 'off-map',
        offMapFamily: 'hostile-input',
        label: 'Empty, whitespace-only, oversized, malformed input. Does it reject safely?',
        checkSurface: 'whatever surface the probe touches',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {kind: "node"} => throws', () => {
      expect(() => QaChecklistItemStub({ kind: 'node' as never })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {malformed id} => throws', () => {
      expect(() => QaChecklistItemStub({ id: 'not-three-segments' as never })).toThrow(/Invalid/u);
    });

    it('EMPTY: {label: ""} => throws, because a unit with no text tells a walker nothing to confirm', () => {
      expect(() => QaChecklistItemStub({ label: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {checkSurface: ""} => throws, because a unit with no surface is unverifiable', () => {
      expect(() => QaChecklistItemStub({ checkSurface: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {unknown extra property} => is stripped by the contract', () => {
      expect(
        qaChecklistItemContract.parse({
          id: 'a-flow:terminal:done',
          flowId: 'a-flow',
          kind: 'terminal',
          label: 'Done',
          checkSurface: 'the running system',
          bogus: 'nope',
        }),
      ).toStrictEqual({
        id: 'a-flow:terminal:done',
        flowId: 'a-flow',
        kind: 'terminal',
        label: 'Done',
        checkSurface: 'the running system',
      });
    });
  });
});
