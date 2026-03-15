import { DependencyStepStub, QuestStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { resolveCodeweaverLayerBroker } from './resolve-codeweaver-layer-broker';
import { resolveCodeweaverLayerBrokerProxy } from './resolve-codeweaver-layer-broker.proxy';

describe('resolveCodeweaverLayerBroker', () => {
  describe('active steps present', () => {
    it('VALID: {steps: [pending]} => launch-codeweaver (no resetStepIds)', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [DependencyStepStub({ status: 'pending' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {steps: [in_progress]} => launch-codeweaver with resetStepIds', () => {
      resolveCodeweaverLayerBrokerProxy();
      const stepId = StepIdStub({ value: 'step-wip' });
      const quest = QuestStub({
        steps: [DependencyStepStub({ id: stepId, status: 'in_progress' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver', resetStepIds: [stepId] });
    });

    it('VALID: {steps: [partially_complete]} => launch-codeweaver with resetStepIds', () => {
      resolveCodeweaverLayerBrokerProxy();
      const stepId = StepIdStub({ value: 'step-partial' });
      const quest = QuestStub({
        steps: [DependencyStepStub({ id: stepId, status: 'partially_complete' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver', resetStepIds: [stepId] });
    });

    it('VALID: {steps: [blocked]} => launch-codeweaver with resetStepIds', () => {
      resolveCodeweaverLayerBrokerProxy();
      const stepId = StepIdStub({ value: 'step-blocked' });
      const quest = QuestStub({
        steps: [DependencyStepStub({ id: stepId, status: 'blocked' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver', resetStepIds: [stepId] });
    });
  });

  describe('mixed step statuses', () => {
    it('VALID: {steps: [complete, pending]} => launch-codeweaver (no resetStepIds)', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [
          DependencyStepStub({ id: StepIdStub({ value: 'step-done' }), status: 'complete' }),
          DependencyStepStub({ id: StepIdStub({ value: 'step-todo' }), status: 'pending' }),
        ],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver' });
    });

    it('VALID: {steps: [complete, failed]} => undefined (no active steps)', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [
          DependencyStepStub({ id: StepIdStub({ value: 'step-done' }), status: 'complete' }),
          DependencyStepStub({ id: StepIdStub({ value: 'step-bad' }), status: 'failed' }),
        ],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toBeUndefined();
    });

    it('VALID: {steps: [failed, in_progress]} => launch-codeweaver with resetStepIds', () => {
      resolveCodeweaverLayerBrokerProxy();
      const wipStepId = StepIdStub({ value: 'step-wip' });
      const quest = QuestStub({
        steps: [
          DependencyStepStub({ id: StepIdStub({ value: 'step-bad' }), status: 'failed' }),
          DependencyStepStub({ id: wipStepId, status: 'in_progress' }),
        ],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver', resetStepIds: [wipStepId] });
    });

    it('VALID: {steps: [pending, in_progress]} => launch-codeweaver with resetStepIds for non-pending only', () => {
      resolveCodeweaverLayerBrokerProxy();
      const wipStepId = StepIdStub({ value: 'step-wip' });
      const quest = QuestStub({
        steps: [
          DependencyStepStub({ id: StepIdStub({ value: 'step-todo' }), status: 'pending' }),
          DependencyStepStub({ id: wipStepId, status: 'in_progress' }),
        ],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver', resetStepIds: [wipStepId] });
    });

    it('VALID: {steps: [blocked, complete]} => launch-codeweaver with resetStepIds', () => {
      resolveCodeweaverLayerBrokerProxy();
      const blockedStepId = StepIdStub({ value: 'step-blocked' });
      const quest = QuestStub({
        steps: [
          DependencyStepStub({ id: blockedStepId, status: 'blocked' }),
          DependencyStepStub({ id: StepIdStub({ value: 'step-done' }), status: 'complete' }),
        ],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toStrictEqual({ action: 'launch-codeweaver', resetStepIds: [blockedStepId] });
    });
  });

  describe('no active steps', () => {
    it('VALID: {steps: [complete]} => undefined', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [DependencyStepStub({ status: 'complete' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toBeUndefined();
    });

    it('VALID: {steps: [failed]} => undefined (failed is terminal)', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({
        steps: [DependencyStepStub({ status: 'failed' })],
      });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toBeUndefined();
    });

    it('EMPTY: {steps: []} => undefined', () => {
      resolveCodeweaverLayerBrokerProxy();
      const quest = QuestStub({ steps: [] });

      const result = resolveCodeweaverLayerBroker({ quest });

      expect(result).toBeUndefined();
    });
  });
});
