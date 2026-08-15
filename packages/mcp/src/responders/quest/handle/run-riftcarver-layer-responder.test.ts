import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { RunRiftcarverLayerResponder } from './run-riftcarver-layer-responder';
import { RunRiftcarverLayerResponderProxy } from './run-riftcarver-layer-responder.proxy';

const JSON_INDENT_SPACES = 2;

describe('RunRiftcarverLayerResponder', () => {
  describe('successful carve', () => {
    it('VALID: {questId, workItemId} => returns the QuestRunRiftcarverResult as JSON text', async () => {
      const proxy = RunRiftcarverLayerResponderProxy();
      const carveResult = proxy.buildResult();
      proxy.setupReturns({
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        result: carveResult,
      });

      const response = await RunRiftcarverLayerResponder({
        args: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
        },
      });

      expect(response).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(carveResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {missing workItemId} => throws before the orchestrator is reached', async () => {
      RunRiftcarverLayerResponderProxy();

      await expect(
        RunRiftcarverLayerResponder({
          args: { questId: 'aaaaaaaa-1111-4222-9333-444444444444' },
        }),
      ).rejects.toThrow(/Required/u);
    });

    it('INVALID: {mode: "full"} => throws, because a carve has no mode', async () => {
      RunRiftcarverLayerResponderProxy();

      await expect(
        RunRiftcarverLayerResponder({
          args: {
            questId: 'aaaaaaaa-1111-4222-9333-444444444444',
            workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
            mode: 'full',
          },
        }),
      ).rejects.toThrow(/Unrecognized key/u);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => returns the JSON error shape with isError', async () => {
      const proxy = RunRiftcarverLayerResponderProxy();
      proxy.setupThrows({
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        error: new Error('git worktree add failed'),
      });

      const response = await RunRiftcarverLayerResponder({
        args: {
          questId: 'aaaaaaaa-1111-4222-9333-444444444444',
          workItemId: 'bbbbbbbb-2222-4333-9444-555555555555',
        },
      });

      expect(response).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'git worktree add failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });
});
