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

  describe('a repeat kill', () => {
    it('VALID: {alreadyKilledAtMs: 1700000123000} => says already killed at that ISO time and names the home already removed', () => {
      const result = KillResultStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        alreadyKilledAtMs: 1_700_000_123_000,
      });

      const rendered = killAnswerRenderTransformer({ result });

      expect(rendered).toBe(
        'inst_7f3a9c21: already killed at 2023-11-14T22:15:23.000Z; nothing to do\nHOME: already removed\n',
      );
    });

    it('EMPTY: {alreadyKilledAtMs: null} => says the time was not recorded', () => {
      const result = KillResultStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        alreadyKilledAtMs: null,
      });

      const rendered = killAnswerRenderTransformer({ result });

      expect(rendered).toBe(
        'inst_7f3a9c21: already killed at an unrecorded time; nothing to do\nHOME: already removed\n',
      );
    });
  });
});
