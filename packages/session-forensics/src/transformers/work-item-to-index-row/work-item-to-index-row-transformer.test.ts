import {
  WorkItemStub,
  OperationItemStub,
  WardResultStub,
  RiftcarverResultStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { workItemToIndexRowTransformer } from './work-item-to-index-row-transformer';

describe('workItemToIndexRowTransformer', () => {
  describe('operation join', () => {
    it('VALID: {relatedDataItems names a real operation} => operationText/flowIds/packageNames come from it', () => {
      const operation = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        text: 'core: notification adapter',
        flowIds: ['notify-flow'],
        packageNames: ['core'],
      });
      const workItem = WorkItemStub({
        relatedDataItems: ['operations/a1b2c3d4-58cc-4372-a567-0e02b2c3d479'],
      });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [operation],
        wardResults: [],
        riftcarverResults: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        operationText: 'core: notification adapter',
        flowIds: ['notify-flow'],
        packageNames: ['core'],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });
    });

    it('EMPTY: {relatedDataItems names no operation} => operationText undefined, flows/packages empty', () => {
      const workItem = WorkItemStub({ relatedDataItems: [] });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [OperationItemStub()],
        wardResults: [],
        riftcarverResults: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });
    });

    it("EDGE: {relatedDataItems names an operation id the operations array doesn't carry} => operationText undefined", () => {
      const workItem = WorkItemStub({
        relatedDataItems: ['operations/00000000-0000-0000-0000-000000000000'],
      });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [OperationItemStub({ id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' })],
        wardResults: [],
        riftcarverResults: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });
    });
  });

  describe('wall clock', () => {
    it('VALID: {startedAt and completedAt both set} => wallClockSeconds is completedAt - startedAt', () => {
      const workItem = WorkItemStub({
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
      });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [],
        riftcarverResults: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        wallClockSeconds: 300,
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });
    });

    it('VALID: {startedAt absent, createdAt and completedAt set} => falls back to createdAt', () => {
      const workItem = WorkItemStub({
        createdAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:02:00.000Z',
      });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [],
        riftcarverResults: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        wallClockSeconds: 120,
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });
    });

    it('EMPTY: {completedAt absent} => wallClockSeconds is omitted entirely', () => {
      const workItem = WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [],
        riftcarverResults: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });
    });
  });

  describe('ward and riftcarver join', () => {
    it('VALID: {relatedDataItems names a ward result} => wardRiftcarverSummary carries its exit code and mode', () => {
      const wardResult = WardResultStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 0,
        wardMode: 'full',
      });
      const workItem = WorkItemStub({
        relatedDataItems: ['wardResults/a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
      });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [wardResult],
        riftcarverResults: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
        wardRiftcarverSummary: 'ward exit 0 (full)',
      });
    });

    it("VALID: {lastWardRunId matches a ward result's runId, no relatedDataItems ref} => still matched", () => {
      const wardResult = WardResultStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 1,
        runId: 'run-42' as never,
      });
      const workItem = WorkItemStub({
        relatedDataItems: [],
        lastWardRunId: 'run-42' as never,
      });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [wardResult],
        riftcarverResults: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
        wardRiftcarverSummary: 'ward exit 1',
      });
    });

    it('VALID: {relatedDataItems names a riftcarver result} => wardRiftcarverSummary carries its outcome and exit code', () => {
      const riftcarverResult = RiftcarverResultStub({
        id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        exitCode: 0,
        outcome: 'green',
      });
      const workItem = WorkItemStub({
        relatedDataItems: ['riftcarverResults/b2c3d4e5-f6a7-8901-bcde-f23456789012'],
      });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [],
        riftcarverResults: [riftcarverResult],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
        wardRiftcarverSummary: 'riftcarver green (exit 0)',
      });
    });

    it('VALID: {both a ward and a riftcarver ref} => summaries join with "; "', () => {
      const wardResult = WardResultStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exitCode: 0,
      });
      const riftcarverResult = RiftcarverResultStub({
        id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        exitCode: 0,
        outcome: 'green',
      });
      const workItem = WorkItemStub({
        relatedDataItems: [
          'wardResults/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          'riftcarverResults/b2c3d4e5-f6a7-8901-bcde-f23456789012',
        ],
      });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [wardResult],
        riftcarverResults: [riftcarverResult],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
        wardRiftcarverSummary: 'ward exit 0; riftcarver green (exit 0)',
      });
    });

    it('EMPTY: {no ward or riftcarver ref} => wardRiftcarverSummary is omitted entirely', () => {
      const workItem = WorkItemStub({ relatedDataItems: [] });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [WardResultStub()],
        riftcarverResults: [RiftcarverResultStub()],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });
    });
  });

  describe('passthrough fields', () => {
    it('VALID: {sessionId set, transcriptSizeBytes and subagentCount passed in} => all three pass through unchanged', () => {
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const workItem = WorkItemStub({ sessionId });

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [],
        riftcarverResults: [],
        transcriptSizeBytes: 4_096,
        subagentCount: 3,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        sessionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 4_096,
        subagentCount: 3,
      });
    });

    it('EMPTY: {no sessionId on the work item} => sessionId is omitted entirely', () => {
      const workItem = WorkItemStub();

      const result = workItemToIndexRowTransformer({
        workItem,
        operations: [],
        wardResults: [],
        riftcarverResults: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });

      expect(result).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        status: 'pending',
        flowIds: [],
        packageNames: [],
        transcriptSizeBytes: 0,
        subagentCount: 0,
      });
    });
  });
});
