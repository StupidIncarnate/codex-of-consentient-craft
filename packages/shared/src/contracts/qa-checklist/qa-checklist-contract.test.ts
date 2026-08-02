import { QaChecklistItemStub } from '../qa-checklist-item/qa-checklist-item.stub';
import { qaChecklistContract } from './qa-checklist-contract';
import { QaChecklistStub } from './qa-checklist.stub';

describe('qaChecklistContract', () => {
  describe('valid checklists', () => {
    it('VALID: {full checklist} => parses paths, items, and what remains', () => {
      expect(QaChecklistStub()).toStrictEqual({
        flowId: 'view-persisted-comments',
        flowName: 'View Persisted Comments on a Quest',
        entryPoint: '/:guildSlug/quest/:questId',
        paths: [
          {
            nodeIds: ['quest-spec-panel-loaded', 'no-comment-badge'],
            branchLabels: ['1 or more queued', 'clicks send'],
            exitsFlow: false,
          },
        ],
        pathsTruncated: false,
        items: [QaChecklistItemStub()],
        remainingItemIds: ['view-persisted-comments:observable:check-badge-count-text'],
      });
    });

    it('VALID: {nothing remaining} => an empty remaining list is the only gate-clearing state', () => {
      expect(QaChecklistStub({ remainingItemIds: [] }).remainingItemIds).toStrictEqual([]);
    });

    it('VALID: {flow with no drawn paths} => defaults every collection to empty', () => {
      expect(
        qaChecklistContract.parse({
          flowId: 'a-flow',
          flowName: 'A Flow',
          entryPoint: '/somewhere',
        }),
      ).toStrictEqual({
        flowId: 'a-flow',
        flowName: 'A Flow',
        entryPoint: '/somewhere',
        paths: [],
        pathsTruncated: false,
        items: [],
        remainingItemIds: [],
      });
    });

    it('VALID: {truncated enumeration} => records the truncation instead of hiding it', () => {
      expect(QaChecklistStub({ pathsTruncated: true }).pathsTruncated).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {flowName: ""} => throws', () => {
      expect(() => QaChecklistStub({ flowName: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {entryPoint: ""} => throws', () => {
      expect(() => QaChecklistStub({ entryPoint: '' as never })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {remaining id not a checklist item id} => throws', () => {
      expect(() => QaChecklistStub({ remainingItemIds: ['not-three-segments' as never] })).toThrow(
        /Invalid/u,
      );
    });
  });
});
