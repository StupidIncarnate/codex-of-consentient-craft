import { workPlanPayloadCodeweaverContract } from './work-plan-payload-codeweaver-contract';
import { WorkPlanPayloadCodeweaverStub } from './work-plan-payload-codeweaver.stub';

describe('workPlanPayloadCodeweaverContract', () => {
  describe('valid payloads', () => {
    it('VALID: {no overrides} => parses the whole worked payload', () => {
      expect(WorkPlanPayloadCodeweaverStub()).toStrictEqual({
        files: [
          {
            path: './packages/web/src/widgets/comment-badge/comment-badge-widget.tsx',
            change: 'new',
            in: '{ count: number }',
            out: 'ReactElement',
          },
          {
            path: './packages/web/src/widgets/comment-badge/comment-badge-widget.test.tsx',
            change: 'new',
            in: '{ count: number }',
            out: 'void',
            proves: ['send-flow:observable:check-badge-count-text'],
          },
        ],
        facts: ['COMMENT_COUNT_BADGE is already the testid every widget test filters on'],
        fences: ['this piece owns packages/web only'],
        traps: ['the badge counts PERSISTED comments, not queued ones'],
        doNotTouch: ['packages/server/src/responders/comment/batch'],
        units: [
          {
            unitId: 'send-flow:observable:check-badge-count-text',
            kind: 'observable',
            observableType: 'ui-state',
            text: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
            assert: 'render the widget with two persisted comments and read the badge text',
            failsIf: 'the badge reads 0 while two comments are persisted',
          },
        ],
      });
    });

    it('EMPTY: {empty object} => every key defaults, so a contracts-only piece parses', () => {
      expect(workPlanPayloadCodeweaverContract.parse({})).toStrictEqual({
        files: [],
        facts: [],
        fences: [],
        traps: [],
        doNotTouch: [],
        units: [],
      });
    });

    it('EMPTY: {units: []} => parses, because a contracts piece proves nothing itself', () => {
      expect(WorkPlanPayloadCodeweaverStub({ units: [] }).units).toStrictEqual([]);
    });
  });

  describe('units are an array keyed by unitId, never a map keyed by observable type', () => {
    it('VALID: {two units, one terminal and one branch} => both survive, though neither carries a type', () => {
      const { units } = WorkPlanPayloadCodeweaverStub({
        units: [
          {
            unitId: 'send-flow:terminal:batch-sent',
            kind: 'terminal',
            text: 'the queue is empty and the batch is on the server',
            assert: 'read the queue length off the store after the send resolves',
            failsIf: 'the queue still holds the sent entries',
          },
          {
            unitId: 'send-flow:branch:queue-has-entries',
            kind: 'branch',
            text: '1 or more queued',
            assert: 'force the queue to one entry and read which node the reducer moves to',
            failsIf: 'the reducer takes the empty-queue branch with one entry queued',
          },
        ],
      });

      expect(units.map((unit) => unit.unitId)).toStrictEqual([
        'send-flow:terminal:batch-sent',
        'send-flow:branch:queue-has-entries',
      ]);
    });

    it('INVALID: {units keyed by observable type} => refused, since a map is not an array', () => {
      expect(
        workPlanPayloadCodeweaverContract.safeParse({
          units: { 'ui-state': { unitId: 'send-flow:observable:check-badge-count-text' } },
        }).success,
      ).toBe(false);
    });
  });

  describe('a payload shaped for another family', () => {
    it('INVALID: {flowrider-shaped units} => refused, since a codeweaver unit requires text', () => {
      expect(
        workPlanPayloadCodeweaverContract.safeParse({
          specPath: './packages/web/src/flows/send/send.e2e.ts',
          mode: 'new',
          units: [
            {
              unitId: 'send-flow:terminal:batch-sent',
              kind: 'terminal',
              layer: 'browser',
              observableTarget: { target: 'node', nodeId: 'batch-sent' },
              assert: 'the queue panel renders zero rows',
              failsIf: 'the panel still renders the sent rows',
            },
          ],
        }).success,
      ).toBe(false);
    });
  });
});
