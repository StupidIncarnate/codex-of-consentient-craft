import {
  OperationItemIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { QuestSignalBackResponderProxy } from './quest-signal-back-responder.proxy';

const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
const operationItemId = OperationItemIdStub({ value: 'cccccccc-1111-4222-9333-444444444444' });

describe('QuestSignalBackResponder', () => {
  describe('successful signal', () => {
    it('VALID: {questId, workItemId, signal, operationItemId, operationStatus: done} => returns 200 { ok: true }', async () => {
      const proxy = QuestSignalBackResponderProxy();

      const result = await proxy.callResponder({
        params: { questId },
        body: { workItemId, signal: 'complete', operationItemId, operationStatus: 'done' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { ok: true },
      });
    });

    it('VALID: {questId, workItemId, signal} => returns 200 { ok: true } for minimal input', async () => {
      const proxy = QuestSignalBackResponderProxy();

      const result = await proxy.callResponder({
        params: { questId },
        body: { workItemId, signal: 'complete' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { ok: true },
      });
    });

    it('VALID: {questId, workItemId, signal, operationStatus: partial} => returns 200 { ok: true }', async () => {
      const proxy = QuestSignalBackResponderProxy();

      const result = await proxy.callResponder({
        params: { questId },
        body: { workItemId, signal: 'complete', operationItemId, operationStatus: 'partial' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { ok: true },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400 with error', async () => {
      const proxy = QuestSignalBackResponderProxy();

      const result = await proxy.callResponder({
        params: null,
        body: { workItemId, signal: 'complete' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid signal-back input' },
      });
    });

    it('INVALID: {missing questId} => returns 400 with error', async () => {
      const proxy = QuestSignalBackResponderProxy();

      const result = await proxy.callResponder({
        params: {},
        body: { workItemId, signal: 'complete' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid signal-back input' },
      });
    });

    it('INVALID: {missing workItemId} => returns 400 with error', async () => {
      const proxy = QuestSignalBackResponderProxy();

      const result = await proxy.callResponder({
        params: { questId },
        body: { signal: 'complete' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid signal-back input' },
      });
    });

    it('INVALID: {non-object body} => returns 400 with error', async () => {
      const proxy = QuestSignalBackResponderProxy();

      const result = await proxy.callResponder({
        params: { questId },
        body: 'not-an-object',
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid signal-back input' },
      });
    });

    it('INVALID: {signal: failed} => returns 400 with error', async () => {
      const proxy = QuestSignalBackResponderProxy();

      const result = await proxy.callResponder({
        params: { questId },
        body: { workItemId, signal: 'failed' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid signal-back input' },
      });
    });

    it('INVALID: {operationStatus: nope} => returns 400 with error', async () => {
      const proxy = QuestSignalBackResponderProxy();

      const result = await proxy.callResponder({
        params: { questId },
        body: { workItemId, signal: 'complete', operationItemId, operationStatus: 'nope' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid signal-back input' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => returns 500 with error message', async () => {
      const proxy = QuestSignalBackResponderProxy();
      proxy.setupSignalBackError({ message: 'ledger write failed' });

      const result = await proxy.callResponder({
        params: { questId },
        body: { workItemId, signal: 'complete' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'ledger write failed' },
      });
    });
  });
});
