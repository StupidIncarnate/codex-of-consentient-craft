import {
  ContentTextStub,
  QuestWorkItemIdStub,
  StepNameStub,
  UnitObservationStub,
  WorkItemRoleStub,
} from '@dungeonmaster/shared/contracts';

import { commitMessageBuildTransformer } from './commit-message-build-transformer';

const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
const FAMILY = WorkItemRoleStub({ value: 'codeweaver' });
const STEP = StepNameStub({ value: 'commit' });
const SCOPE = ContentTextStub({ value: 'add-auth — package: auth · flow: login-flow' });

describe('commitMessageBuildTransformer', () => {
  describe('one met, one cant-meet with a toSettle, and one unmet', () => {
    it('VALID: {one of each mark} => renders the exact byte-for-byte message', () => {
      const met = UnitObservationStub({
        unitId: 'login-flow:observable:check-token-stored',
        mark: 'met',
        evidence: 'packages/auth/src/token-store.test.ts:12 — asserts localStorage holds the token',
      });
      const cantMeet = UnitObservationStub({
        unitId: 'login-flow:observable:check-redirect',
        mark: 'cant-meet',
        evidence: 'no OAuth provider reachable from this worktree',
        toSettle: 'drive a real OAuth redirect against a live provider in CI',
      });
      const unmet = UnitObservationStub({
        unitId: 'login-flow:observable:check-error-banner',
        mark: 'unmet',
        evidence: 'assertion written, not yet passing',
      });

      const result = commitMessageBuildTransformer({
        family: FAMILY,
        step: STEP,
        scope: SCOPE,
        workItems: [{ id: WORK_ITEM_ID, observations: [met, cantMeet, unmet] }],
      });

      expect(result).toBe(
        'codeweaver/commit: add-auth — package: auth · flow: login-flow\n\n' +
          'met       login-flow:observable:check-token-stored\n' +
          'cant-meet login-flow:observable:check-redirect — drive a real OAuth redirect against a live provider in CI\n' +
          'unmet     login-flow:observable:check-error-banner — assertion written, not yet passing\n' +
          `work items: ${String(WORK_ITEM_ID)}`,
      );
    });
  });

  describe('several met units', () => {
    it('VALID: {two met observations} => joins both ids on the one met line', () => {
      const metOne = UnitObservationStub({ unitId: 'flow:observable:a', mark: 'met' });
      const metTwo = UnitObservationStub({ unitId: 'flow:observable:b', mark: 'met' });

      const result = commitMessageBuildTransformer({
        family: FAMILY,
        step: STEP,
        scope: SCOPE,
        workItems: [{ id: WORK_ITEM_ID, observations: [metOne, metTwo] }],
      });

      expect(result).toBe(
        'codeweaver/commit: add-auth — package: auth · flow: login-flow\n\n' +
          'met       flow:observable:a · flow:observable:b\n' +
          `work items: ${String(WORK_ITEM_ID)}`,
      );
    });
  });

  describe('no marks at all', () => {
    it('EMPTY: {no observations} => the body skips straight to the work items line', () => {
      const result = commitMessageBuildTransformer({
        family: WorkItemRoleStub({ value: 'spiritmender' }),
        step: StepNameStub({ value: 'repair' }),
        scope: ContentTextStub({ value: 'fix ward (committed) failures' }),
        workItems: [{ id: WORK_ITEM_ID, observations: [] }],
      });

      expect(result).toBe(
        `spiritmender/repair: fix ward (committed) failures\n\nwork items: ${String(WORK_ITEM_ID)}`,
      );
    });
  });

  describe('several work items covered by one commit', () => {
    it('VALID: {two work items} => joins both ids on the work items line', () => {
      const secondWorkItemId = QuestWorkItemIdStub({
        value: '12345678-1234-1234-1234-123456789abc',
      });

      const result = commitMessageBuildTransformer({
        family: FAMILY,
        step: STEP,
        scope: SCOPE,
        workItems: [
          { id: WORK_ITEM_ID, observations: [] },
          { id: secondWorkItemId, observations: [] },
        ],
      });

      expect(result).toBe(
        'codeweaver/commit: add-auth — package: auth · flow: login-flow\n\n' +
          `work items: ${String(WORK_ITEM_ID)} · ${String(secondWorkItemId)}`,
      );
    });
  });
});
