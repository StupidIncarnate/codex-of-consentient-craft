import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { KillResultStub } from '../../contracts/kill-result/kill-result.stub';
import { killAnswerRenderTransformer } from './kill-answer-render-transformer';

describe('killAnswerRenderTransformer', () => {
  describe('ordinary kill with no reaped processes', () => {
    it('VALID: {reapedPgids: []} => renders reaped count 0 (none) and HOME removed', () => {
      const result = KillResultStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        reapedPgids: [],
        homeRemoved: true,
      });

      const rendered = killAnswerRenderTransformer({ result });

      expect(rendered).toBe('KILLED: inst_7f3a9c21\nPROCESSES REAPED: 0 (none)\nHOME: removed\n');
    });
  });

  describe('orphan reap path with multiple processes', () => {
    it('VALID: {reapedPgids: [1234, 5678]} => renders count and joined list', () => {
      const result = KillResultStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        reapedPgids: [1234, 5678],
        homeRemoved: true,
      });

      const rendered = killAnswerRenderTransformer({ result });

      expect(rendered).toBe(
        'KILLED: inst_7f3a9c21\nPROCESSES REAPED: 2 (1234, 5678)\nHOME: removed\n',
      );
    });
  });

  describe('kill where home was preserved', () => {
    it('VALID: {homeRemoved: false} => renders HOME preserved', () => {
      const result = KillResultStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        reapedPgids: [],
        homeRemoved: false,
      });

      const rendered = killAnswerRenderTransformer({ result });

      expect(rendered).toBe('KILLED: inst_7f3a9c21\nPROCESSES REAPED: 0 (none)\nHOME: preserved\n');
    });
  });

  describe('explicit killed field', () => {
    it('VALID: {killed: [9999]} => renders from killed array', () => {
      const result = KillResultStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        reapedPgids: [],
        killed: [9999],
        homeRemoved: true,
      });

      const rendered = killAnswerRenderTransformer({ result });

      expect(rendered).toBe('KILLED: inst_7f3a9c21\nPROCESSES REAPED: 1 (9999)\nHOME: removed\n');
    });
  });
});
