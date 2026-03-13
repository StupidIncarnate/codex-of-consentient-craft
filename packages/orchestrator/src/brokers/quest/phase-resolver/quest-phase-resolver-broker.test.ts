import {
  DependencyStepStub,
  ExecutionLogEntryStub,
  ObservableIdStub,
  PathseekerRunStub,
  QuestStub,
  SessionIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { questPhaseResolverBroker } from './quest-phase-resolver-broker';
import { questPhaseResolverBrokerProxy } from './quest-phase-resolver-broker.proxy';

describe('questPhaseResolverBroker', () => {
  describe('spec design phase (ChaosWhisperer)', () => {
    it('VALID: {status: created} => launch-chat chaoswhisperer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'created' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-chat', role: 'chaoswhisperer' });
    });

    it('VALID: {status: pending} => launch-chat chaoswhisperer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'pending' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-chat', role: 'chaoswhisperer' });
    });

    it('VALID: {status: explore_flows, with session} => resume-chat chaoswhisperer', () => {
      questPhaseResolverBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const quest = QuestStub({ status: 'explore_flows', questCreatedSessionBy: sessionId });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'resume-chat',
        role: 'chaoswhisperer',
        resumeSessionId: sessionId,
      });
    });

    it('VALID: {status: explore_flows, no session} => launch-chat chaoswhisperer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'explore_flows' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-chat', role: 'chaoswhisperer' });
    });

    it('VALID: {status: review_flows} => wait-for-user gate 1', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'review_flows' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'wait-for-user',
        context: 'User must approve flows (Gate 1)',
      });
    });

    it('VALID: {status: flows_approved, with session} => resume-chat chaoswhisperer', () => {
      questPhaseResolverBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const quest = QuestStub({ status: 'flows_approved', questCreatedSessionBy: sessionId });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'resume-chat',
        role: 'chaoswhisperer',
        resumeSessionId: sessionId,
      });
    });

    it('VALID: {status: flows_approved, no session} => launch-chat chaoswhisperer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'flows_approved' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-chat', role: 'chaoswhisperer' });
    });

    it('VALID: {status: explore_observables, with session} => resume-chat chaoswhisperer', () => {
      questPhaseResolverBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const quest = QuestStub({
        status: 'explore_observables',
        questCreatedSessionBy: sessionId,
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'resume-chat',
        role: 'chaoswhisperer',
        resumeSessionId: sessionId,
      });
    });

    it('VALID: {status: explore_observables, no session} => launch-chat chaoswhisperer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'explore_observables' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-chat', role: 'chaoswhisperer' });
    });

    it('VALID: {status: review_observables} => wait-for-user gate 2', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'review_observables' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'wait-for-user',
        context: 'User must approve observables (Gate 2)',
      });
    });
  });

  describe('design phase (Glyphsmith)', () => {
    it('VALID: {status: approved, needsDesign: true} => wait-for-user design choice', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'approved', needsDesign: true });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'wait-for-user',
        context: 'User chooses: start quest or start design',
      });
    });

    it('VALID: {status: explore_design, with designSessionBy} => resume-chat glyphsmith', () => {
      questPhaseResolverBrokerProxy();
      const sessionId = SessionIdStub({ value: 'design-session-abc' });
      const quest = QuestStub({ status: 'explore_design', designSessionBy: sessionId });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'resume-chat',
        role: 'glyphsmith',
        resumeSessionId: sessionId,
      });
    });

    it('VALID: {status: explore_design, no designSessionBy} => launch-chat glyphsmith', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'explore_design' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-chat', role: 'glyphsmith' });
    });

    it('VALID: {status: review_design} => wait-for-user design approval', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'review_design' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'wait-for-user',
        context: 'User must approve designs',
      });
    });
  });

  describe('pre-execution gates', () => {
    it('VALID: {status: approved, needsDesign: false} => wait-for-user start quest', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'approved', needsDesign: false });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'wait-for-user',
        context: 'User must click start quest',
      });
    });

    it('VALID: {status: design_approved} => wait-for-user start quest', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'design_approved' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'wait-for-user',
        context: 'User must click start quest',
      });
    });
  });

  describe('in_progress - pathseeker', () => {
    it('VALID: {no pathseekerRuns} => launch-pathseeker', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'in_progress', pathseekerRuns: [] });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-pathseeker' });
    });

    it('VALID: {in_progress run with session} => resume-pathseeker', () => {
      questPhaseResolverBrokerProxy();
      const sessionId = SessionIdStub({ value: 'ps-session-abc' });
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [PathseekerRunStub({ sessionId, status: 'in_progress' })],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'resume-pathseeker',
        resumeSessionId: sessionId,
      });
    });

    it('VALID: {in_progress run without session} => launch-pathseeker', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [PathseekerRunStub({ status: 'in_progress' })],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-pathseeker' });
    });

    it('VALID: {complete run} => falls through to codeweaver', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({
            status: 'complete',
            completedAt: '2024-01-15T11:00:00.000Z',
          }),
        ],
        steps: [DependencyStepStub({ status: 'pending' })],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {verification_failed, attempts < 3} => launch-pathseeker', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({
            attempt: 0,
            status: 'verification_failed',
            completedAt: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-pathseeker' });
    });

    it('VALID: {verification_failed, attempts >= 3} => blocked', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({
            attempt: 0,
            status: 'verification_failed',
            completedAt: '2024-01-15T11:00:00.000Z',
          }),
          PathseekerRunStub({
            attempt: 1,
            status: 'verification_failed',
            completedAt: '2024-01-15T12:00:00.000Z',
          }),
          PathseekerRunStub({
            attempt: 2,
            status: 'verification_failed',
            completedAt: '2024-01-15T13:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'blocked',
        context: 'PathSeeker failed after maximum attempts',
      });
    });

    it('VALID: {failed run} => blocked', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({
            status: 'failed',
            completedAt: '2024-01-15T11:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'blocked',
        context: 'PathSeeker failed after maximum attempts',
      });
    });
  });

  describe('in_progress - codeweaver', () => {
    it('VALID: {steps pending} => launch-codeweaver', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'pending' })],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {steps in_progress} => launch-codeweaver', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'in_progress' })],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {steps partially_complete} => launch-codeweaver', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'partially_complete' })],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {steps blocked} => launch-codeweaver', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'blocked' })],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {all steps complete} => falls through to ward', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });

    it('VALID: {all steps failed} => falls through to ward', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'failed' })],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });

    it('VALID: {mixed complete and failed steps} => falls through to ward', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [
          DependencyStepStub({ id: StepIdStub({ value: 'step-a' }), status: 'complete' }),
          DependencyStepStub({ id: StepIdStub({ value: 'step-b' }), status: 'failed' }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });
  });

  describe('in_progress - ward', () => {
    it('VALID: {no ward entries} => launch-ward', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });

    it('VALID: {ward fail, failCount < 3} => launch-ward', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });

    it('VALID: {ward fail, failCount >= 3} => blocked', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'fail',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'blocked', context: 'Ward failed 3 times' });
    });

    it('VALID: {ward pass, not invalidated} => falls through to siegemaster', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-siegemaster' });
    });

    it('VALID: {ward pass, invalidated by codeweaver} => launch-ward', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'codeweaver',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });
  });

  describe('in_progress - siegemaster', () => {
    it('VALID: {no siege entries} => launch-siegemaster', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-siegemaster' });
    });

    it('VALID: {siege pass, not invalidated} => falls through to lawbringer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });

    it('VALID: {siege pass, invalidated by ward} => launch-siegemaster', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-siegemaster' });
    });

    it('VALID: {siege fail, failCount < 2, with failedObservableIds} => launch-codeweaver with resetStepIds', () => {
      questPhaseResolverBrokerProxy();
      const obsId = ObservableIdStub({ value: 'login-redirects-to-dashboard' });
      const stepId = StepIdStub({ value: 'create-login-api' });
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [
          DependencyStepStub({ id: stepId, status: 'complete', observablesSatisfied: [obsId] }),
        ],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            timestamp: '2024-01-15T13:00:00.000Z',
            failedObservableIds: [obsId],
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'launch-codeweaver',
        resetStepIds: [stepId],
      });
    });

    it('VALID: {siege fail, no failedObservableIds} => launch-codeweaver without resetStepIds', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {siege fail, failCount >= 2} => blocked', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'fail',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'blocked', context: 'Siegemaster failed 2 times' });
    });
  });

  describe('in_progress - lawbringer', () => {
    it('VALID: {no lawbringer entries} => launch-lawbringer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });

    it('VALID: {lawbringer pass, not invalidated} => complete', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'pass',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'complete' });
    });

    it('VALID: {lawbringer pass, invalidated by siegemaster} => launch-lawbringer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });

    it('VALID: {lawbringer fail, failCount < 2} => launch-lawbringer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'fail',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });

    it('VALID: {lawbringer fail, failCount >= 2} => blocked', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'fail',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'fail',
            timestamp: '2024-01-15T15:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'blocked', context: 'Lawbringer failed 2 times' });
    });
  });

  describe('in_progress - full cascade', () => {
    it('VALID: {all phases passed and not invalidated} => complete', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'pass',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'complete' });
    });
  });

  describe('in_progress - temporal ordering (invalidation cascades)', () => {
    it('VALID: {codeweaver after ward pass} => ward invalidated, launch-ward', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'pass',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
          ExecutionLogEntryStub({ agentType: 'codeweaver', timestamp: '2024-01-15T15:00:00.000Z' }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-ward' });
    });

    it('VALID: {ward after siege pass} => siege invalidated, launch-siegemaster', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-siegemaster' });
    });

    it('VALID: {siegemaster after lawbringer pass} => lawbringer invalidated, launch-lawbringer', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'complete', completedAt: '2024-01-15T11:00:00.000Z' }),
        ],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({
            agentType: 'ward',
            status: 'pass',
            timestamp: '2024-01-15T12:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'lawbringer',
            status: 'pass',
            timestamp: '2024-01-15T13:00:00.000Z',
          }),
          ExecutionLogEntryStub({
            agentType: 'siegemaster',
            status: 'pass',
            timestamp: '2024-01-15T14:00:00.000Z',
          }),
        ],
      });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-lawbringer' });
    });
  });

  describe('terminal states', () => {
    it('VALID: {status: complete} => wait-for-user quest complete', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'complete' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'wait-for-user', context: 'Quest complete' });
    });

    it('VALID: {status: abandoned} => wait-for-user quest abandoned', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'abandoned' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({ action: 'wait-for-user', context: 'Quest abandoned' });
    });

    it('VALID: {status: blocked} => wait-for-user quest blocked', () => {
      questPhaseResolverBrokerProxy();
      const quest = QuestStub({ status: 'blocked' });

      const result = questPhaseResolverBroker({ quest });

      expect(result).toStrictEqual({
        action: 'wait-for-user',
        context: 'Quest blocked, needs intervention',
      });
    });
  });
});
