import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { WorkItemIdStub } from '../../../contracts/work-item-id/work-item-id.stub';
import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { handleSignalLayerBroker } from './handle-signal-layer-broker';
import { handleSignalLayerBrokerProxy } from './handle-signal-layer-broker.proxy';

describe('handleSignalLayerBroker', () => {
  describe('complete signal', () => {
    it('VALID: {signal: complete, workItemId} => calls markCompleted and returns continue action', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markCompleted: mockMarkCompleted,
      });
      const signal = StreamSignalStub({ signal: 'complete' });

      const result = await handleSignalLayerBroker({ signal, workItemId, workTracker });

      expect(result).toStrictEqual({ action: 'continue' });
      expect(mockMarkCompleted).toHaveBeenCalledTimes(1);
    });

    it('VALID: {signal: complete, no workItemId} => skips markCompleted and returns continue action', async () => {
      handleSignalLayerBrokerProxy();
      const mockMarkCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markCompleted: mockMarkCompleted,
      });
      const signal = StreamSignalStub({ signal: 'complete' });

      const result = await handleSignalLayerBroker({ signal, workTracker });

      expect(result).toStrictEqual({ action: 'continue' });
      expect(mockMarkCompleted).toHaveBeenCalledTimes(0);
    });
  });

  describe('partially-complete signal', () => {
    it('VALID: {signal: partially-complete, workItemId, continuationPoint: defined} => returns respawn action with continuationPoint', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkPartiallyCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markPartiallyCompleted: mockMarkPartiallyCompleted,
      });
      const signal = StreamSignalStub({
        signal: 'partially-complete',
        continuationPoint: 'Continue from step 2' as never,
      });

      const result = await handleSignalLayerBroker({ signal, workItemId, workTracker });

      expect(result).toStrictEqual({
        action: 'respawn',
        continuationPoint: 'Continue from step 2',
      });
      expect(mockMarkPartiallyCompleted).toHaveBeenCalledTimes(1);
    });

    it('VALID: {signal: partially-complete, no workItemId} => skips markPartiallyCompleted and returns respawn action', async () => {
      handleSignalLayerBrokerProxy();
      const mockMarkPartiallyCompleted = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markPartiallyCompleted: mockMarkPartiallyCompleted,
      });
      const signal = StreamSignalStub({
        signal: 'partially-complete',
        continuationPoint: 'Continue from step 2' as never,
      });

      const result = await handleSignalLayerBroker({ signal, workTracker });

      expect(result).toStrictEqual({
        action: 'respawn',
        continuationPoint: 'Continue from step 2',
      });
      expect(mockMarkPartiallyCompleted).toHaveBeenCalledTimes(0);
    });
  });

  describe('needs-role-followup signal', () => {
    it('VALID: {signal: needs-role-followup, workItemId, all fields defined} => returns spawn_role action with all fields', async () => {
      handleSignalLayerBrokerProxy();
      const workItemId = WorkItemIdStub({ value: 'work-item-1' });
      const mockMarkBlocked = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markBlocked: mockMarkBlocked,
      });
      const signal = StreamSignalStub({
        signal: 'needs-role-followup',
        targetRole: 'spiritmender' as never,
        reason: 'Need code review' as never,
        context: 'Review context' as never,
      });

      const result = await handleSignalLayerBroker({ signal, workItemId, workTracker });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'spiritmender',
        reason: 'Need code review',
        context: 'Review context',
      });
      expect(mockMarkBlocked).toHaveBeenCalledTimes(1);
    });

    it('VALID: {signal: needs-role-followup, no workItemId} => skips markBlocked and returns spawn_role action', async () => {
      handleSignalLayerBrokerProxy();
      const mockMarkBlocked = jest.fn().mockResolvedValue(undefined);
      const workTracker = WorkTrackerStub({
        markBlocked: mockMarkBlocked,
      });
      const signal = StreamSignalStub({
        signal: 'needs-role-followup',
        targetRole: 'spiritmender' as never,
        reason: 'Need code review' as never,
        context: 'Review context' as never,
      });

      const result = await handleSignalLayerBroker({ signal, workTracker });

      expect(result).toStrictEqual({
        action: 'spawn_role',
        targetRole: 'spiritmender',
        reason: 'Need code review',
        context: 'Review context',
      });
      expect(mockMarkBlocked).toHaveBeenCalledTimes(0);
    });
  });
});
