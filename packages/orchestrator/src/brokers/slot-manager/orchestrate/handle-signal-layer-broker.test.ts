import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { WorkItemIdStub } from '../../../contracts/work-item-id/work-item-id.stub';
import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { handleSignalLayerBroker } from './handle-signal-layer-broker';
import { handleSignalLayerBrokerProxy } from './handle-signal-layer-broker.proxy';

const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });

describe('handleSignalLayerBroker', () => {
  describe('complete signal', () => {
    it('VALID: {signal: complete, questId, workItemId} => calls markCompleted and returns continue action', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markCompleted: mockMarkCompleted,
      });
      const signal = StreamSignalStub({ signal: 'complete' });

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'codeweaver',
      });

      expect(result).toStrictEqual({ action: 'continue' });
      expect(mockMarkCompleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('failed signal - codeweaver', () => {
    it('VALID: {signal: failed, role: codeweaver} => spawns pathseeker', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({ signal: 'failed', summary: 'Tests broken' as never });

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'codeweaver',
      });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'pathseeker',
        summary: 'Tests broken',
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('failed signal - siegemaster', () => {
    it('VALID: {signal: failed, role: siegemaster} => spawns pathseeker', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({ signal: 'failed', summary: 'Modal not rendered' as never });

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'siegemaster',
      });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'pathseeker',
        summary: 'Modal not rendered',
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('failed signal - lawbringer', () => {
    it('VALID: {signal: failed, role: lawbringer} => spawns spiritmender', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({
        signal: 'failed',
        summary: 'Missing test coverage' as never,
      });

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'lawbringer',
      });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'spiritmender',
        summary: 'Missing test coverage',
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('failed signal - spiritmender', () => {
    it('VALID: {signal: failed, role: spiritmender} => spawns pathseeker', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({
        signal: 'failed',
        summary: 'Architectural issue' as never,
      });

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'spiritmender',
      });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'pathseeker',
        summary: 'Architectural issue',
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('failed signal - blightwarden', () => {
    it('VALID: {signal: failed, role: blightwarden} => spawns pathseeker', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({
        signal: 'failed',
        summary: 'Audit blocked' as never,
      });

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'blightwarden',
      });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'pathseeker',
        summary: 'Audit blocked',
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('failed signal - pesteater', () => {
    it('VALID: {signal: failed, role: pesteater} => bubbles to user (no slot-manager recovery)', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({ signal: 'failed', summary: 'Cannot reproduce' as never });

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'pesteater',
      });

      expect(result).toStrictEqual({
        action: 'bubble_to_user',
        summary: 'Cannot reproduce',
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('failed signal - pathseeker', () => {
    it('VALID: {signal: failed, role: pathseeker} => bubbles to user', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({ signal: 'failed', summary: 'Cannot plan steps' as never });

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'pathseeker',
      });

      expect(result).toStrictEqual({
        action: 'bubble_to_user',
        summary: 'Cannot plan steps',
      });
      expect(mockMarkFailed).toHaveBeenCalledTimes(1);
    });
  });

  describe('failed signal - with default summary', () => {
    it('VALID: {signal: failed, default stub summary} => includes summary in result', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({ signal: 'failed' });

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'siegemaster',
      });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'pathseeker',
        summary: 'Task completed successfully',
      });
    });
  });

  describe('failed signal - no summary', () => {
    it('VALID: {signal: failed, no summary} => spawn_role result has no summary property', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({ signal: 'failed' });
      Reflect.deleteProperty(signal, 'summary');

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'codeweaver',
      });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'pathseeker',
      });
    });

    it('VALID: {signal: failed, no summary, pathseeker} => bubble_to_user result has no summary property', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkFailed = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markFailed: mockMarkFailed,
      });
      const signal = StreamSignalStub({ signal: 'failed' });
      Reflect.deleteProperty(signal, 'summary');

      const result = await handleSignalLayerBroker({
        signal,
        questId,
        workItemId,
        workTracker,
        role: 'pathseeker',
      });

      expect(result).toStrictEqual({
        action: 'bubble_to_user',
      });
    });
  });
});
