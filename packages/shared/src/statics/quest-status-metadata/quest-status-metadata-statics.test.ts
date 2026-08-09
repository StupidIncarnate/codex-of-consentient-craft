import { questStatusMetadataStatics } from './quest-status-metadata-statics';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

describe('questStatusMetadataStatics', () => {
  describe('coverage', () => {
    it('VALID: statuses => covers all 18 quest statuses', () => {
      const statusKeys = Object.keys(questStatusMetadataStatics.statuses).sort();

      expect(statusKeys).toStrictEqual(
        [
          'abandoned',
          'approved',
          'blocked',
          'complete',
          'created',
          'design_approved',
          'explore_design',
          'explore_flows',
          'explore_observables',
          'flows_approved',
          'in_progress',
          'merged',
          'merging',
          'paused',
          'pending',
          'review_design',
          'review_flows',
          'review_observables',
        ].sort(),
      );
    });
  });

  describe('row values', () => {
    it('VALID: in_progress => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.in_progress).toStrictEqual({
        isPreExecution: false,
        isAnyAgentRunning: true,
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
        isBeforeSpecApproved: false,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: true,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'IN PROGRESS',
      });
    });

    it('VALID: approved => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.approved).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: true,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: true,
        isBeforeSpecApproved: false,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: null,
        previousReviewStatus: 'review_observables',
        displayHeader: 'SPEC APPROVED',
      });
    });

    it('VALID: review_flows => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.review_flows).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: true,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: 'flows_approved',
        previousReviewStatus: null,
        displayHeader: 'FLOW APPROVAL',
      });
    });

    it('VALID: review_observables => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.review_observables).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: true,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: 'approved',
        previousReviewStatus: null,
        displayHeader: 'OBSERVABLES APPROVAL',
      });
    });

    it('VALID: review_design => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.review_design).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: false,
        isDesignPhase: true,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: 'design_approved',
        previousReviewStatus: null,
        displayHeader: 'DESIGN APPROVAL',
      });
    });

    it('VALID: paused => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.paused).toStrictEqual({
        isPreExecution: false,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: true,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: false,
        isResumable: true,
        isStartable: false,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: false,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: true,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'EXECUTION PAUSED',
      });
    });

    it('VALID: complete => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.complete).toStrictEqual({
        isPreExecution: false,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: true,
        isPauseable: false,
        isResumable: false,
        isStartable: false,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: false,
        isDesignPhase: false,
        isAbandonable: false,
        isCompletedSuccessfully: true,
        shouldRenderExecutionPanel: true,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'EXECUTION COMPLETE',
      });
    });

    it('VALID: merging => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.merging).toStrictEqual({
        isPreExecution: false,
        isAnyAgentRunning: true,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: false,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: true,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'MERGING',
      });
    });

    it('VALID: merged => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.merged).toStrictEqual({
        isPreExecution: false,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: true,
        isPauseable: false,
        isResumable: false,
        isStartable: false,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: false,
        isDesignPhase: false,
        isAbandonable: false,
        isCompletedSuccessfully: true,
        shouldRenderExecutionPanel: true,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'MERGED',
      });
    });

    it('VALID: abandoned => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.abandoned).toStrictEqual({
        isPreExecution: false,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: true,
        isPauseable: false,
        isResumable: false,
        isStartable: false,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: false,
        isDesignPhase: false,
        isAbandonable: false,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: true,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'ABANDONED',
      });
    });

    it('VALID: blocked => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.blocked).toStrictEqual({
        isPreExecution: false,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: true,
        isTerminal: false,
        isPauseable: true,
        isResumable: true,
        isStartable: false,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: false,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: true,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'EXECUTION BLOCKED',
      });
    });

    it('VALID: created => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.created).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isDeleteBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: true,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'QUEST CREATED',
      });
    });

    it('VALID: pending => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.pending).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: true,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'QUEST CREATED',
      });
    });

    it('VALID: explore_flows => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.explore_flows).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: true,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'EXPLORING FLOWS',
      });
    });

    it('VALID: flows_approved => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.flows_approved).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: false,
        isGateApproved: true,
        isBeforeSpecApproved: true,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: null,
        previousReviewStatus: 'review_flows',
        displayHeader: 'FLOWS APPROVED',
      });
    });

    it('VALID: explore_observables => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.explore_observables).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: true,
        isDesignPhase: false,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'EXPLORING OBSERVABLES',
      });
    });

    it('VALID: explore_design => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.explore_design).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: false,
        isRecoverable: true,
        isAutoResumable: false,
        isGateApproved: false,
        isBeforeSpecApproved: false,
        isDesignPhase: true,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: null,
        previousReviewStatus: null,
        displayHeader: 'EXPLORING DESIGN',
      });
    });

    it('VALID: design_approved => matches expected metadata', () => {
      expect(questStatusMetadataStatics.statuses.design_approved).toStrictEqual({
        isPreExecution: true,
        isAnyAgentRunning: false,
        isActivelyExecuting: false,
        isUserPaused: false,
        isQuestBlocked: false,
        isTerminal: false,
        isPauseable: true,
        isResumable: false,
        isStartable: true,
        isRecoverable: false,
        isAutoResumable: false,
        isGateApproved: true,
        isBeforeSpecApproved: false,
        isDesignPhase: true,
        isAbandonable: true,
        isCompletedSuccessfully: false,
        shouldRenderExecutionPanel: false,
        nextApprovalStatus: null,
        previousReviewStatus: 'review_design',
        displayHeader: 'DESIGN APPROVED',
      });
    });
  });

  describe('isBeforeSpecApproved matrix', () => {
    const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

    const BEFORE_SPEC_APPROVED_STATUSES: ReadonlySet<StatusKey> = new Set([
      'created',
      'pending',
      'explore_flows',
      'review_flows',
      'flows_approved',
      'explore_observables',
      'review_observables',
    ]);

    it.each(STATUSES)(
      'VALID: {status: %s} => isBeforeSpecApproved matches expected flag',
      (status) => {
        const expected = BEFORE_SPEC_APPROVED_STATUSES.has(status);

        expect(questStatusMetadataStatics.statuses[status].isBeforeSpecApproved).toBe(expected);
      },
    );
  });
});
