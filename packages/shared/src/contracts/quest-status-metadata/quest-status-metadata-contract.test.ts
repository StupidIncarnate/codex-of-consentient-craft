import { questStatusMetadataContract } from './quest-status-metadata-contract';
import { QuestStatusMetadataStub } from './quest-status-metadata.stub';
import { DisplayHeaderStub } from '../display-header/display-header.stub';

describe('questStatusMetadataContract', () => {
  describe('valid metadata', () => {
    it('VALID: {fully populated metadata} => parses successfully', () => {
      const result = questStatusMetadataContract.parse({
        isPreExecution: true,
        isPathseekerRunning: false,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: false,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: false,
        isGateApproved: false,
        isDesignPhase: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: 'flows_approved',
        displayHeader: DisplayHeaderStub({ value: 'FLOWS APPROVED' }),
      });

      expect(result).toStrictEqual({
        isPreExecution: true,
        isPathseekerRunning: false,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: false,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: false,
        isGateApproved: false,
        isDesignPhase: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: 'flows_approved',
        displayHeader: 'FLOWS APPROVED',
      });
    });

    it('VALID: {nextApprovalStatus null} => parses successfully', () => {
      const result = questStatusMetadataContract.parse({
        isPreExecution: false,
        isPathseekerRunning: false,
        isAnyAgentRunning: false,
        isActivelyExecuting: true,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: true,
        isGateApproved: false,
        isDesignPhase: false,
        shouldRenderExecutionPanel: true,
        nextApprovalStatus: null,
        displayHeader: DisplayHeaderStub({ value: 'IN PROGRESS' }),
      });

      expect(result.nextApprovalStatus).toBe(null);
    });
  });

  describe('invalid metadata', () => {
    it('ERROR: {missing isTerminal field} => throws validation error', () => {
      expect(() =>
        questStatusMetadataContract.parse({
          isPreExecution: false,
          isPathseekerRunning: false,
          isAnyAgentRunning: false,
          isActivelyExecuting: false,
          isUserPaused: false,
          isQuestBlocked: false,
          isPauseable: false,
          isResumable: false,
          isStartable: false,
          isRecoverable: false,
          isAutoResumable: false,
          isGateApproved: false,
          isDesignPhase: false,
          shouldRenderExecutionPanel: false,
          nextApprovalStatus: null,
          displayHeader: DisplayHeaderStub({ value: 'QUEST CREATED' }),
        }),
      ).toThrow('Required');
    });

    it('ERROR: {non-boolean flag} => throws validation error', () => {
      expect(() =>
        questStatusMetadataContract.parse({
          isPreExecution: 'false',
          isPathseekerRunning: false,
          isAnyAgentRunning: false,
          isActivelyExecuting: false,
          isUserPaused: false,
          isQuestBlocked: false,
          isTerminal: false,
          isPauseable: false,
          isResumable: false,
          isStartable: false,
          isRecoverable: false,
          isAutoResumable: false,
          isGateApproved: false,
          isDesignPhase: false,
          shouldRenderExecutionPanel: false,
          nextApprovalStatus: null,
          displayHeader: DisplayHeaderStub({ value: 'QUEST CREATED' }),
        }),
      ).toThrow('Expected boolean, received string');
    });

    it('ERROR: {invalid nextApprovalStatus value} => throws validation error', () => {
      expect(() =>
        questStatusMetadataContract.parse({
          isPreExecution: false,
          isPathseekerRunning: false,
          isAnyAgentRunning: false,
          isActivelyExecuting: false,
          isUserPaused: false,
          isQuestBlocked: false,
          isTerminal: false,
          isPauseable: false,
          isResumable: false,
          isStartable: false,
          isRecoverable: false,
          isAutoResumable: false,
          isGateApproved: false,
          isDesignPhase: false,
          shouldRenderExecutionPanel: false,
          nextApprovalStatus: 'not_a_real_status',
          displayHeader: DisplayHeaderStub({ value: 'QUEST CREATED' }),
        }),
      ).toThrow('Invalid enum value');
    });
  });

  describe('stub', () => {
    it('VALID: QuestStatusMetadataStub() => returns default all-false metadata', () => {
      const result = QuestStatusMetadataStub();

      expect(result).toStrictEqual({
        isPreExecution: false,
        isPathseekerRunning: false,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: false,
        isResumable: false,
        isStartable: false,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: false,
        isDesignPhase: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: null,
        displayHeader: 'QUEST CREATED',
      });
    });

    it('VALID: QuestStatusMetadataStub({isTerminal: true}) => overrides given field', () => {
      const result = QuestStatusMetadataStub({ isTerminal: true });

      expect(result.isTerminal).toBe(true);
    });
  });
});
