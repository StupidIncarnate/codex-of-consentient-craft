import { CommentAnchorStub } from '../../contracts/comment-anchor/comment-anchor.stub';

import { staleAnchorNoticeTransformer } from './stale-anchor-notice-transformer';

describe('staleAnchorNoticeTransformer', () => {
  describe('one anchor', () => {
    it('VALID: {staleAnchors: [one node anchor]} => names the flow/node path with singular wording', () => {
      const result = staleAnchorNoticeTransformer({
        staleAnchors: [CommentAnchorStub({ flowId: 'login-flow', nodeId: 'start' })],
      });

      expect(result).toBe(
        'Dropped 1 queued comment — its box no longer exists on the quest: login-flow / start',
      );
    });

    it('VALID: {staleAnchors: [one observable anchor]} => names the flow/node/observable path with singular wording', () => {
      const result = staleAnchorNoticeTransformer({
        staleAnchors: [
          CommentAnchorStub({
            flowId: 'login-flow',
            nodeId: 'start',
            observableId: 'login-redirects-to-dashboard',
          }),
        ],
      });

      expect(result).toBe(
        'Dropped 1 queued comment — its box no longer exists on the quest: login-flow / start / login-redirects-to-dashboard',
      );
    });
  });

  describe('multiple anchors', () => {
    it('VALID: {staleAnchors: [three node anchors]} => names each path comma-separated with plural wording', () => {
      const result = staleAnchorNoticeTransformer({
        staleAnchors: [
          CommentAnchorStub({ flowId: 'a', nodeId: 'b' }),
          CommentAnchorStub({ flowId: 'c', nodeId: 'd' }),
          CommentAnchorStub({ flowId: 'e', nodeId: 'f' }),
        ],
      });

      expect(result).toBe(
        'Dropped 3 queued comments — their boxes no longer exist on the quest: a / b, c / d, e / f',
      );
    });
  });
});
