import { workPlanPayloadFlowriderContract } from './work-plan-payload-flowrider-contract';
import { WorkPlanPayloadFlowriderStub } from './work-plan-payload-flowrider.stub';

describe('workPlanPayloadFlowriderContract', () => {
  describe('valid payloads', () => {
    it('VALID: {no overrides} => parses the whole worked payload', () => {
      expect(WorkPlanPayloadFlowriderStub()).toStrictEqual({
        specPath: './packages/web/src/flows/send/send-batch.e2e.ts',
        mode: 'new',
        harnesses: [
          {
            path: './packages/web/test/harnesses/send/send.harness.ts',
            change: 'new',
            in: '{ page: Page }',
            out: 'SendHarness',
          },
        ],
        walk: {
          shape: 'journey',
          paths: [
            {
              nodeIds: ['queue-has-entries', 'toolbar-visible', 'click-send-batch', 'batch-sent'],
              branchLabels: ['1 or more queued', 'clicks send'],
              exitsFlow: false,
            },
          ],
          pathsTruncated: false,
        },
        units: [
          {
            unitId: 'send-flow:terminal:batch-sent',
            kind: 'terminal',
            layer: 'browser',
            observableTarget: { target: 'node', nodeId: 'batch-sent' },
            assert: 'the queue panel renders zero rows once the send resolves',
            failsIf: 'the panel still renders the sent rows',
          },
        ],
        facts: ['the send button carries testid PIXEL_BTN and the label SEND'],
        fences: ['this piece owns one spec file'],
        traps: ['the queue drains asynchronously — waiting on a timeout reads the pre-send state'],
        doNotTouch: ['packages/web/src/widgets/comment-badge'],
      });
    });

    it('VALID: {mode: extend} => parses', () => {
      expect(WorkPlanPayloadFlowriderStub({ mode: 'extend' }).mode).toBe('extend');
    });
  });

  describe('units may not be empty on this family', () => {
    it('EMPTY: {units: []} => refused, since a flowrider piece exists to prove units', () => {
      expect(() => WorkPlanPayloadFlowriderStub({ units: [] })).toThrow(
        /Array must contain at least 1 element/u,
      );
    });
  });

  describe('walk.paths reuses the real walk-path shape', () => {
    it('VALID: {path with exitsFlow true} => the crossing survives the parse', () => {
      const { walk } = WorkPlanPayloadFlowriderStub({
        walk: {
          shape: 'matrix',
          paths: [
            {
              nodeIds: ['queue-has-entries', 'hand-off-to-review'],
              branchLabels: ['1 or more queued'],
              exitsFlow: true,
            },
          ],
          pathsTruncated: true,
        },
      });

      expect(walk).toStrictEqual({
        shape: 'matrix',
        paths: [
          {
            nodeIds: ['queue-has-entries', 'hand-off-to-review'],
            branchLabels: ['1 or more queued'],
            exitsFlow: true,
          },
        ],
        pathsTruncated: true,
      });
    });

    it('INVALID: {path carrying forceLabels instead of branchLabels} => the labels are dropped, so the branches vanish', () => {
      const { walk } = workPlanPayloadFlowriderContract.parse({
        specPath: './packages/web/src/flows/send/send-batch.e2e.ts',
        mode: 'new',
        walk: {
          shape: 'journey',
          paths: [{ nodeIds: ['queue-has-entries'], forceLabels: ['1 or more queued'] }],
        },
        units: [
          {
            unitId: 'send-flow:terminal:batch-sent',
            kind: 'terminal',
            layer: 'browser',
            observableTarget: { target: 'node', nodeId: 'batch-sent' },
            assert: 'the queue panel renders zero rows once the send resolves',
            failsIf: 'the panel still renders the sent rows',
          },
        ],
      });

      expect(walk.paths).toStrictEqual([
        { nodeIds: ['queue-has-entries'], branchLabels: [], exitsFlow: false },
      ]);
    });
  });

  describe('harnesses carry no proves list', () => {
    it('INVALID: {harness with proves} => the key is dropped, since a harness settles no unit', () => {
      const { harnesses } = WorkPlanPayloadFlowriderStub({
        harnesses: [
          {
            path: './packages/web/test/harnesses/send/send.harness.ts',
            change: 'new',
            in: '{ page: Page }',
            out: 'SendHarness',
            proves: ['send-flow:terminal:batch-sent'],
          } as never,
        ],
      });

      expect(harnesses).toStrictEqual([
        {
          path: './packages/web/test/harnesses/send/send.harness.ts',
          change: 'new',
          in: '{ page: Page }',
          out: 'SendHarness',
        },
      ]);
    });
  });

  describe('invalid payloads', () => {
    it('EMPTY: {empty object} => refused, since specPath, walk and units carry no defaults', () => {
      expect(workPlanPayloadFlowriderContract.safeParse({}).success).toBe(false);
    });

    it('INVALID: {specPath with no ./ prefix} => refused', () => {
      expect(() =>
        WorkPlanPayloadFlowriderStub({ specPath: 'packages/web/src/flows/send/send-batch.e2e.ts' }),
      ).toThrow(/Path must be absolute \(start with \/ or C:/u);
    });
  });
});
